"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { OverpassKita } from "@/lib/overpass";

// ─── OpenFreeMap styles (free, no API key) ────────────────────────────────────
const STYLE_URLS = {
  normal_light: "https://tiles.openfreemap.org/styles/positron",
  normal_dark:  "https://tiles.openfreemap.org/styles/dark-matter",
  satellite:    "https://tiles.openfreemap.org/styles/positron", // fallback — no free sat vector style
  terrain3d:    "https://tiles.openfreemap.org/styles/liberty",  // liberty includes building heights
} as const;

// ESRI satellite raster tiles (used as background for satellite mode)
const ESRI_SAT_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const BUILDINGS_LAYER = "3d-buildings";

// ─── Kita pin colours ─────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  public:  "#2563eb",
  church:  "#d97706",
  private: "#7c3aed",
  free:    "#059669",
};

function kitaPin(color: string, selected: boolean): string {
  const h = selected ? 46 : 38;
  const w = selected ? 30 : 25;
  return `<svg width="${w}" height="${h}" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27S30 25.5 30 15C30 6.716 23.284 0 15 0z" fill="${color}" opacity="0.92"/>
    <circle cx="15" cy="15" r="7" fill="white" opacity="0.9"/>
    <path d="M15 8l-6 5.5h2V20h3.5v-3h1v3H19v-6.5h2L15 8z" fill="${color}"/>
  </svg>`;
}

function svgToImageData(svgStr: string, w: number, h: number): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = w * 2; canvas.height = h * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) { reject(new Error("no canvas")); return; }
    const img = new Image(w * 2, h * 2);
    img.onload = () => { ctx.drawImage(img, 0, 0, w * 2, h * 2); resolve(ctx.getImageData(0, 0, w * 2, h * 2)); };
    img.onerror = reject;
    const sized = svgStr.replace(/(<svg[^>]*)width="[^"]*"\s*height="[^"]*"/, `$1width="${w * 2}" height="${h * 2}"`);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sized)}`;
  });
}

// Pre-render all 8 Kita-pin variants (4 types × 2 states) into the map image atlas.
// Must complete BEFORE the kita-pins symbol layer is added, otherwise MapLibre renders
// nothing and "styleimagemissing" fires in a race-prone async cycle.
async function preloadPinImages(map: maplibregl.Map) {
  const variants: Array<{ type: string; sel: boolean }> = [
    { type: "public",  sel: false }, { type: "public",  sel: true },
    { type: "church",  sel: false }, { type: "church",  sel: true },
    { type: "private", sel: false }, { type: "private", sel: true },
    { type: "free",    sel: false }, { type: "free",    sel: true },
  ];
  await Promise.all(
    variants.map(async ({ type, sel }) => {
      const id = `pin-${type}-${sel ? "sel" : "def"}`;
      if (map.hasImage(id)) return;
      const color = TYPE_COLORS[type] ?? "#2563eb";
      const img = await svgToImageData(kitaPin(color, sel), sel ? 30 : 25, sel ? 46 : 38);
      if (!map.hasImage(id)) map.addImage(id, img, { pixelRatio: 2 });
    })
  );
}

// Inject one-time CSS for pulse animation
let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === "undefined") return;
  cssInjected = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes kita-pulse { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(2.2);opacity:0} }
    .kita-user-dot { width:14px;height:14px;border-radius:50%;background:#2563eb;border:2.5px solid #fff;box-shadow:0 0 6px rgba(37,99,235,.7);position:relative;z-index:1; }
    .kita-user-wrap { position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center; }
    .kita-user-wrap::before { content:'';position:absolute;width:20px;height:20px;border-radius:50%;background:rgba(37,99,235,.3);animation:kita-pulse 1.6s ease-out infinite; }
    .maplibregl-popup-content { background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important; }
    .maplibregl-popup-tip { display:none!important; }
  `;
  document.head.appendChild(s);
}

export interface KitaMapGLProps {
  kitas: OverpassKita[];
  center: { lat: number; lng: number };
  radiusKm?: number;
  selectedId?: string | null;
  userPos?: [number, number] | null;
  isDark?: boolean;
  tileType?: "normal" | "satellite" | "terrain";
  onSelect: (kita: OverpassKita) => void;
}

const SOURCE_ID = "kitas";

export function KitaMapGL({
  kitas,
  center,
  radiusKm = 5,
  selectedId,
  userPos,
  isDark = false,
  tileType = "normal",
  onSelect,
}: KitaMapGLProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  const userMarker   = useRef<maplibregl.Marker | null>(null);
  const initialised  = useRef(false);
  const kitasRef     = useRef<OverpassKita[]>(kitas);
  const onSelectRef  = useRef(onSelect);
  onSelectRef.current = onSelect;

  const styleKey = tileType === "terrain"
    ? "terrain3d"
    : tileType === "satellite"
    ? "satellite"
    : isDark ? "normal_dark" : "normal_light";

  // ─── Build GeoJSON from kitas ─────────────────────────────────────────────
  const toGeoJSON = useCallback((list: OverpassKita[]): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: list.map((k) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [k.lng, k.lat] },
      properties: {
        id:       k.id,
        name:     k.name ?? "Unbekannte Kita",
        type:     k.kitaType ?? "public",
        color:    TYPE_COLORS[k.kitaType ?? "public"] ?? "#2563eb",
        selected: k.id === selectedId,
      },
    })),
  }), [selectedId]);

  // ─── Radius circle as GeoJSON ─────────────────────────────────────────────
  function buildRadiusGeoJSON(lat: number, lng: number, km: number): GeoJSON.FeatureCollection {
    const steps = 64;
    const coords: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const dlat = (km / 111.32) * Math.cos(angle);
      const dlng = (km / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
      coords.push([lng + dlng, lat + dlat]);
    }
    return {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [coords] },
        properties: {},
      }],
    };
  }

  // ─── 3D buildings toggle (identical to ladeKompass) ──────────────────────
  function toggle3D(map: maplibregl.Map, enable: boolean) {
    if (enable) {
      map.setPitch(50);
      map.setBearing(-15);
      if (!map.getLayer(BUILDINGS_LAYER)) {
        try {
          map.addLayer({
            id:     BUILDINGS_LAYER,
            source: "openmaptiles",
            "source-layer": "building",
            type:   "fill-extrusion",
            minzoom: 14,
            paint: {
              "fill-extrusion-color":
                isDark
                  ? ["interpolate", ["linear"], ["get", "render_height"], 0, "#1e293b", 50, "#334155", 200, "#475569"]
                  : ["interpolate", ["linear"], ["get", "render_height"], 0, "#d1d5db", 50, "#9ca3af", 200, "#6b7280"],
              "fill-extrusion-height":  ["coalesce", ["get", "render_height"], ["get", "height"], 10],
              "fill-extrusion-base":    ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0],
              "fill-extrusion-opacity": 0.75,
            },
          });
        } catch {
          // source-layer not in current style — skip silently
        }
      } else {
        map.setLayoutProperty(BUILDINGS_LAYER, "visibility", "visible");
      }
    } else {
      map.setPitch(0);
      map.setBearing(0);
      if (map.getLayer(BUILDINGS_LAYER)) {
        map.setLayoutProperty(BUILDINGS_LAYER, "visibility", "none");
      }
    }
  }

  // ─── Setup map once ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || initialised.current) return;
    initialised.current = true;
    injectCSS();

    const rLat = radiusKm / 111.32;
    const rLng = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));

    const map = new maplibregl.Map({
      container:   containerRef.current,
      style:       STYLE_URLS[styleKey],
      bounds:      [[center.lng - rLng, center.lat - rLat], [center.lng + rLng, center.lat + rLat]],
      fitBoundsOptions: { padding: 60 },
      // No transformRequest — OpenFreeMap styles embed their own working glyph server URLs.
      // Redirecting to third-party font servers causes "Unimplemented type" PBF format errors.
    });

    mapRef.current = map;

    // Add zoom + compass controls
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    map.once("load", async () => {
      // Pre-load all 8 Kita pin variants BEFORE adding the symbol layer
      await preloadPinImages(map);

      // Satellite mode: add raster source as background
      if (tileType === "satellite" && !map.getSource("esri-sat")) {
        map.addSource("esri-sat", {
          type: "raster",
          tiles: [ESRI_SAT_TILES],
          tileSize: 256,
          attribution: "Tiles \u00a9 Esri",
        });
        map.addLayer({ id: "esri-sat-layer", type: "raster", source: "esri-sat" }, map.getStyle().layers?.[0]?.id);
      }

      // Radius circle \u2014 guard existence so HMR/strict-mode double-mount never throws
      if (!map.getSource("radius")) {
        map.addSource("radius", { type: "geojson", data: buildRadiusGeoJSON(center.lat, center.lng, radiusKm) });
      }
      if (!map.getLayer("radius-fill")) map.addLayer({ id: "radius-fill", type: "fill", source: "radius", paint: { "fill-color": "#2563eb", "fill-opacity": 0.06 } });
      if (!map.getLayer("radius-line")) map.addLayer({ id: "radius-line", type: "line", source: "radius", paint: { "line-color": "#2563eb", "line-width": 1.5, "line-dasharray": [4, 3] } });

      // Kita markers (GeoJSON + symbol layer)
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: toGeoJSON(kitasRef.current),
          cluster: true,
          clusterMaxZoom: 13,
          clusterRadius: 50,
        });
      }

      if (!map.getLayer("clusters")) {
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          paint: {
            "circle-color":        "#2563eb",
            "circle-radius":       ["step", ["get", "point_count"], 20, 10, 28, 50, 36],
            "circle-stroke-width": 3,
            "circle-stroke-color": "#1d4ed8",
          },
        });
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: SOURCE_ID,
          filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13 },
          paint: { "text-color": "#fff" },
        });
        // Individual kita pins — images are pre-loaded above, no styleimagemissing needed
        map.addLayer({
          id: "kita-pins",
          type: "symbol",
          source: SOURCE_ID,
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image":         ["concat", "pin-", ["get", "type"], "-", ["case", ["get", "selected"], "sel", "def"]],
            "icon-size":          ["interpolate", ["linear"], ["zoom"], 10, 0.8, 14, 1.1, 17, 1.5],
            "icon-allow-overlap": true,
            "icon-anchor":        "bottom",
            "text-field":         ["step", ["zoom"], "", 15, ["get", "name"]],
            "text-size":          11,
            "text-anchor":        "top",
            "text-offset":        [0, 0.2],
            "text-max-width":     10,
          },
          paint: {
            "text-color":      isDark ? "#fff" : "#1e293b",
            "text-halo-color": isDark ? "rgba(0,0,0,.8)" : "rgba(255,255,255,.9)",
            "text-halo-width": 1.5,
          },
        });
      }

      // 3D buildings if terrain mode
      if (tileType === "terrain") toggle3D(map, true);

      // Click cluster → zoom in
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const f = features[0];
        if (!f) return;
        void (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource)
          .getClusterExpansionZoom(f.properties.cluster_id as number)
          .then((zoom) => map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom }));
      });

      // Click kita pin → select
      map.on("click", "kita-pins", (e) => {
        e.preventDefault();
        const f = e.features?.[0];
        if (!f) return;
        const id = f.properties?.id as string;
        const kita = kitasRef.current.find((k) => k.id === id);
        if (kita) onSelectRef.current(kita);
      });

      map.on("mouseenter", "clusters", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "clusters", () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "kita-pins", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "kita-pins", () => { map.getCanvas().style.cursor = ""; });
    });

    // Only POI sprite placeholders — our pin-* images are pre-loaded eagerly.
    map.on("styleimagemissing", (e: { id: string }) => {
      if (!e.id.startsWith("pin-") && !map.hasImage(e.id)) {
        const canvas = document.createElement("canvas");
        canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (ctx) map.addImage(e.id, ctx.getImageData(0, 0, 1, 1));
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
      initialised.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Update kitas data ────────────────────────────────────────────────────
  useEffect(() => {
    kitasRef.current = kitas;
    const map = mapRef.current;
    if (!map || !map.getSource(SOURCE_ID)) return;
    (map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource).setData(toGeoJSON(kitas));
  }, [kitas, selectedId, toGeoJSON]);

  // ─── Fly to center + zoom from radius (fitBounds → Kreis füllt Viewport) ───
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const rLat = radiusKm / 111.32;
    const rLng = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));
    map.fitBounds(
      [[center.lng - rLng, center.lat - rLat], [center.lng + rLng, center.lat + rLat]],
      { padding: 60, duration: 900 }
    );
    // Update radius circle
    if (map.getSource("radius")) {
      (map.getSource("radius") as maplibregl.GeoJSONSource).setData(buildRadiusGeoJSON(center.lat, center.lng, radiusKm));
    }
  }, [center.lat, center.lng, radiusKm]);

  // ─── User location marker ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (userMarker.current) { userMarker.current.remove(); userMarker.current = null; }
    if (!userPos) return;
    const el = document.createElement("div");
    el.className = "kita-user-wrap";
    el.innerHTML = `<div class="kita-user-dot"></div>`;
    userMarker.current = new maplibregl.Marker({ element: el })
      .setLngLat([userPos[1], userPos[0]])
      .addTo(map);
  }, [userPos]);

  // ─── Style reload when tileType or isDark changes ────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !initialised.current) return;
    const newStyle = tileType === "terrain"
      ? STYLE_URLS.terrain3d
      : tileType === "satellite"
      ? STYLE_URLS.satellite
      : isDark ? STYLE_URLS.normal_dark : STYLE_URLS.normal_light;

    map.setStyle(newStyle, { diff: false });

    map.once("styledata", async () => {
      // Re-load pin images after style wipe
      await preloadPinImages(map);

      // Re-add satellite raster layer on top of vector base
      if (tileType === "satellite" && !map.getSource("esri-sat")) {
        map.addSource("esri-sat", { type: "raster", tiles: [ESRI_SAT_TILES], tileSize: 256, attribution: "Tiles © Esri" });
        map.addLayer({ id: "esri-sat-layer", type: "raster", source: "esri-sat" }, map.getStyle().layers?.[0]?.id);
      }

      // Re-add radius
      if (!map.getSource("radius")) {
        map.addSource("radius", { type: "geojson", data: buildRadiusGeoJSON(center.lat, center.lng, radiusKm) });
      }
      if (!map.getLayer("radius-fill")) map.addLayer({ id: "radius-fill", type: "fill", source: "radius", paint: { "fill-color": "#2563eb", "fill-opacity": 0.06 } });
      if (!map.getLayer("radius-line")) map.addLayer({ id: "radius-line", type: "line", source: "radius", paint: { "line-color": "#2563eb", "line-width": 1.5, "line-dasharray": [4, 3] } });

      // Re-add kita source + layers
      if (!map.getSource(SOURCE_ID)) {
        map.addSource(SOURCE_ID, { type: "geojson", data: toGeoJSON(kitasRef.current), cluster: true, clusterMaxZoom: 13, clusterRadius: 50 });
      }
      if (!map.getLayer("clusters")) {
        map.addLayer({ id: "clusters", type: "circle", source: SOURCE_ID, filter: ["has", "point_count"], paint: { "circle-color": "#2563eb", "circle-radius": ["step", ["get", "point_count"], 20, 10, 28, 50, 36], "circle-stroke-width": 3, "circle-stroke-color": "#1d4ed8" } });
        map.addLayer({ id: "cluster-count", type: "symbol", source: SOURCE_ID, filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 13 }, paint: { "text-color": "#fff" } });
        map.addLayer({ id: "kita-pins", type: "symbol", source: SOURCE_ID, filter: ["!", ["has", "point_count"]], layout: { "icon-image": ["concat", "pin-", ["get", "type"], "-", ["case", ["get", "selected"], "sel", "def"]], "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 14, 1.1, 17, 1.5], "icon-allow-overlap": true, "icon-anchor": "bottom", "text-field": ["step", ["zoom"], "", 15, ["get", "name"]], "text-size": 11, "text-anchor": "top", "text-offset": [0, 0.2], "text-max-width": 10 }, paint: { "text-color": isDark ? "#fff" : "#1e293b", "text-halo-color": isDark ? "rgba(0,0,0,.8)" : "rgba(255,255,255,.9)", "text-halo-width": 1.5 } });
      }

      // 3D buildings for terrain mode
      if (tileType === "terrain") toggle3D(map, true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileType, isDark]);

  return <div ref={containerRef} className="h-full w-full" />;
}
