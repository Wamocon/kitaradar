import { MapPin } from "lucide-react";

export function MapPlaceholder() {
  return (
    <div className="flex h-full min-h-96 items-center justify-center bg-blue-50/50 dark:bg-blue-950/10">
      <div className="text-center">
        <MapPin className="mx-auto h-12 w-12 text-primary/30" />
        <p className="mt-3 text-sm text-muted">
          Karte wird geladen…<br />
          <span className="text-xs">(OpenStreetMap Integration – Tag 2)</span>
        </p>
      </div>
    </div>
  );
}
