"use client";

import type { OverpassKita } from "@/lib/overpass";
import { MapPin, Phone, Mail, Globe, Tag } from "lucide-react";
import { useTranslations } from "next-intl";

const typeLabels: Record<OverpassKita["kitaType"], string> = {
  public: "Kommunal",
  church: "Kirchlich",
  private: "Privat",
  free: "Frei",
};

const typeBadgeColors: Record<OverpassKita["kitaType"], string> = {
  public: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  church: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  private: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  free: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

interface KitaCardProps {
  kita: OverpassKita;
  selected: boolean;
  onSelect: () => void;
  onApply: () => void;
}

export function KitaCard({ kita, selected, onSelect, onApply }: KitaCardProps) {
  const t = useTranslations("common");

  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-lg border p-4 transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:border-primary/50 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2">{kita.name}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeColors[kita.kitaType]}`}
        >
          <Tag className="mr-1 inline h-3 w-3" />
          {typeLabels[kita.kitaType]}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-xs text-muted">
        {kita.address && (
          <p className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {kita.address}{kita.city ? `, ${kita.city}` : ""}
          </p>
        )}
        {kita.distanceKm != null && (
          <p className="font-medium text-foreground/70">
            {t("km_away", { distance: kita.distanceKm })}
          </p>
        )}
        {kita.phone && (
          <p className="flex items-center gap-1">
            <Phone className="h-3 w-3 shrink-0" />
            <a href={`tel:${kita.phone}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
              {kita.phone}
            </a>
          </p>
        )}
        {kita.email && (
          <p className="flex items-center gap-1">
            <Mail className="h-3 w-3 shrink-0" />
            <a href={`mailto:${kita.email}`} onClick={(e) => e.stopPropagation()} className="hover:underline truncate">
              {kita.email}
            </a>
          </p>
        )}
        {kita.website && (
          <p className="flex items-center gap-1">
            <Globe className="h-3 w-3 shrink-0" />
            <a
              href={kita.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:underline truncate"
            >
              Website
            </a>
          </p>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onApply();
        }}
        className="mt-3 w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
      >
        Jetzt bewerben
      </button>
    </div>
  );
}
