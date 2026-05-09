"use client";

import { memo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { OverpassKita } from "@/lib/overpass";

// Fix default Leaflet icon paths in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const selectedIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13, { animate: true });
  }, [center, map]);
  return null;
}

interface KitaMapProps {
  kitas: OverpassKita[];
  center: { lat: number; lng: number };
  selectedId?: string | null;
  onSelect: (kita: OverpassKita) => void;
}

export const KitaMap = memo(function KitaMap({ kitas, center, selectedId, onSelect }: KitaMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      className="h-full w-full rounded-lg"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={[center.lat, center.lng]} />
      {kitas.map((kita) => (
        <Marker
          key={kita.id}
          position={[kita.lat, kita.lng]}
          icon={selectedId === kita.id ? selectedIcon : defaultIcon}
          eventHandlers={{ click: () => onSelect(kita) }}
        >
          <Popup>
            <strong>{kita.name}</strong>
            {kita.address && <p className="text-xs text-muted-foreground">{kita.address}</p>}
            {kita.distanceKm != null && (
              <p className="text-xs">{kita.distanceKm} km entfernt</p>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
});
