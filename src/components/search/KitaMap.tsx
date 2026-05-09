"use client";

import { memo, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { OverpassKita } from "@/lib/overpass";

// Fix Leaflet icon paths in Next.js
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom SVG pin icons
function createKitaPin(color: string, selected: boolean): L.DivIcon {
  const size = selected ? 38 : 30;
  const html = `<svg width="${size}" height="${Math.round(size * 1.4)}" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27S30 25.5 30 15C30 6.716 23.284 0 15 0z" fill="${color}" opacity="${selected ? 1 : 0.9}"/>
    <circle cx="15" cy="15" r="7" fill="white" opacity="0.9"/>
    <path d="M15 8l-6 5.5h2V20h3.5v-3h1v3H19v-6.5h2L15 8z" fill="${color}"/>
    ${selected ? `<circle cx="15" cy="0" r="5" fill="white" stroke="${color}" stroke-width="2"/>` : ""}
  </svg>`;
  return L.divIcon({
    className: "",
    html,
    iconSize: [size, Math.round(size * 1.4)],
    iconAnchor: [size / 2, Math.round(size * 1.4)],
    popupAnchor: [0, -Math.round(size * 1.4)],
  });
}

const TYPE_COLORS: Record<string, string> = {
  public: "#2563eb",
  church: "#d97706",
  private: "#7c3aed",
  free: "#059669",
};

function getPin(kita: OverpassKita, selected: boolean): L.DivIcon {
  const color = TYPE_COLORS[kita.kitaType] ?? "#2563eb";
  return createKitaPin(color, selected);
}

// Tile styles (CARTO — free, no API key required)
const CARTO_LIGHT = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const CARTO_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const CARTO_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Satellite — ESRI World Imagery (free, no API key)
const ESRI_SATELLITE = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_ATTR = "Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";

// Terrain / pseudo-3D — OpenTopoMap
const TOPO_TERRAIN = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
const TOPO_ATTR = "Map data &copy; <a href='https://openstreetmap.org'>OpenStreetMap</a> contributors, SRTM | Style &copy; <a href='https://opentopomap.org'>OpenTopoMap</a> (CC-BY-SA)";

function radiusToZoom(km: number): number {
  // zoom 14 @ 1 km, zoom 13 @ 2 km, zoom 12 @ 5 km, zoom 11 @ 10 km, …
  return Math.max(8, Math.min(15, Math.round(14 - Math.log2(Math.max(km, 0.5)))));
}

function Recenter({ center, radiusKm }: { center: [number, number]; radiusKm?: number }) {
  const map = useMap();
  useEffect(() => {
    const zoom = radiusKm !== undefined ? radiusToZoom(radiusKm) : map.getZoom();
    map.flyTo(center, zoom, { duration: 0.8, easeLinearity: 0.35 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, radiusKm]);
  return null;
}

function ClusteredMarkers({
  kitas,
  selectedId,
  onSelect,
}: {
  kitas: OverpassKita[];
  selectedId: string | null | undefined;
  onSelect: (kita: OverpassKita) => void;
}) {
  const map = useMap();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically import to avoid SSR issues
    import("leaflet.markercluster").then(() => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cluster = (L as any).markerClusterGroup({
        maxClusterRadius: 50,
        iconCreateFunction: (c: { getChildCount: () => number }) => {
          const count = c.getChildCount();
          return L.divIcon({
            html: `<div style="background:#2563eb;color:#fff;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3)">${count}</div>`,
            className: "",
            iconSize: [36, 36],
          });
        },
      });

      kitas.forEach((kita) => {
        const marker = L.marker([kita.lat, kita.lng], {
          icon: getPin(kita, kita.id === selectedId),
        });
        marker.on("click", () => onSelect(kita));
        cluster.addLayer(marker);
      });

      map.addLayer(cluster);
      clusterRef.current = cluster;
    });

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kitas, selectedId]);

  return null;
}

function UserLocationMarker({ pos }: { pos: [number, number] | null }) {
  if (!pos) return null;
  return (
    <Marker
      position={pos}
      icon={L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,.25)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })}
    />
  );
}

export interface KitaMapProps {
  kitas: OverpassKita[];
  center: { lat: number; lng: number };
  radiusKm?: number;
  selectedId?: string | null;
  userPos?: [number, number] | null;
  isDark?: boolean;
  tileType?: "normal" | "satellite" | "terrain";
  onSelect: (kita: OverpassKita) => void;
}

export const KitaMap = memo(function KitaMap({
  kitas,
  center,
  radiusKm,
  selectedId,
  userPos,
  isDark = false,
  tileType = "normal",
  onSelect,
}: KitaMapProps) {
  // Determine tile URL and attribution based on type
  let tileUrl: string;
  let tileAttr: string;
  if (tileType === "satellite") {
    tileUrl = ESRI_SATELLITE;
    tileAttr = ESRI_ATTR;
  } else if (tileType === "terrain") {
    tileUrl = TOPO_TERRAIN;
    tileAttr = TOPO_ATTR;
  } else {
    tileUrl = isDark ? CARTO_DARK : CARTO_LIGHT;
    tileAttr = CARTO_ATTR;
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="h-full w-full"
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer key={tileType} url={tileUrl} attribution={tileAttr} maxZoom={19} />

      {/* Zoom control top-right */}
      {/* (Leaflet adds it bottom-right by default — removed via zoomControl=false so we keep UI clean) */}

      <Recenter center={[center.lat, center.lng]} radiusKm={radiusKm} />

      {/* Search radius indicator */}
      {radiusKm && (
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 0.05,
            weight: 1.5,
            dashArray: "6 4",
          }}
        />
      )}

      <UserLocationMarker pos={userPos ?? null} />

      <ClusteredMarkers
        kitas={kitas}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </MapContainer>
  );
});

