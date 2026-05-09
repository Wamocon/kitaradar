"use client";

import { useEffect } from "react";
import type { OverpassKita } from "@/lib/overpass";
import {
  X,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Users,
  Tag,
  Info,
  Accessibility,
  ExternalLink,
  ChevronRight,
  Printer,
  Baby,
  BookOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";

const TYPE_LABELS: Record<OverpassKita["kitaType"], string> = {
  public: "Kommunal",
  church: "Kirchlich",
  private: "Privat",
  free: "Frei",
};

const TYPE_COLORS: Record<OverpassKita["kitaType"], string> = {
  public: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700",
  church: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700",
  private: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-700",
  free: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-700",
};

interface KitaDetailModalProps {
  kita: OverpassKita | null;
  onClose: () => void;
  onApply: (kita: OverpassKita) => void;
}

function DetailRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
          >
            {value}
            {href.startsWith("http") && <ExternalLink className="h-3 w-3 shrink-0" />}
          </a>
        ) : (
          <p className="text-sm text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}

export function KitaDetailModal({ kita, onClose, onApply }: KitaDetailModalProps) {
  const t = useTranslations("search");

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!kita) return null;

  const osmUrl = `https://www.openstreetmap.org/node/${kita.osmId}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${kita.lat},${kita.lng}`;
  const fullAddress = [kita.address, kita.postalCode, kita.city].filter(Boolean).join(", ");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel — slides in from right */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={kita.name}
        className="fixed right-0 top-0 z-[3001] flex h-full w-full max-w-lg flex-col bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border bg-card px-5 py-4">
          <div className="min-w-0">
            <span className={`mb-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[kita.kitaType]}`}>
              <Tag className="h-3 w-3" />
              {TYPE_LABELS[kita.kitaType]}
            </span>
            <h2 className="text-lg font-bold text-foreground leading-tight">{kita.name}</h2>
            {kita.distanceKm != null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {kita.distanceKm} km entfernt
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* Description */}
          {kita.description && (
            <div className="mb-4 rounded-lg bg-accent/50 px-4 py-3">
              <p className="flex items-start gap-2 text-sm text-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {kita.description}
              </p>
            </div>
          )}

          {/* Kontakt & Adresse */}
          <div className="mb-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Kontakt & Adresse
            </h3>
            <div className="rounded-lg border border-border bg-card px-4 py-1">
              {fullAddress && (
                <DetailRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Adresse"
                  value={fullAddress}
                  href={mapsUrl}
                />
              )}
              {kita.phone && (
                <DetailRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Telefon"
                  value={kita.phone}
                  href={`tel:${kita.phone}`}
                />
              )}
              {kita.fax && (
                <DetailRow
                  icon={<Printer className="h-4 w-4" />}
                  label="Fax"
                  value={kita.fax}
                />
              )}
              {kita.email && (
                <DetailRow
                  icon={<Mail className="h-4 w-4" />}
                  label="E-Mail"
                  value={kita.email}
                  href={`mailto:${kita.email}`}
                />
              )}
              {kita.website && (
                <DetailRow
                  icon={<Globe className="h-4 w-4" />}
                  label="Website"
                  value={kita.website.replace(/^https?:\/\//, "")}
                  href={kita.website.startsWith("http") ? kita.website : `https://${kita.website}`}
                />
              )}
            </div>
          </div>

          {/* Einrichtungsdetails */}
          <div className="mb-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Einrichtungsdetails
            </h3>
            <div className="rounded-lg border border-border bg-card px-4 py-1">
              {kita.operator && (
                <DetailRow
                  icon={<BookOpen className="h-4 w-4" />}
                  label="Träger / Betreiber"
                  value={kita.operator}
                />
              )}
              {kita.openingHours && (
                <DetailRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Öffnungszeiten"
                  value={kita.openingHours}
                />
              )}
              {kita.capacity != null && (
                <DetailRow
                  icon={<Users className="h-4 w-4" />}
                  label="Kapazität (Plätze)"
                  value={`${kita.capacity} Plätze`}
                />
              )}
              {(kita.minAge != null || kita.maxAge != null) && (
                <DetailRow
                  icon={<Baby className="h-4 w-4" />}
                  label="Altersgruppe"
                  value={
                    kita.minAge != null && kita.maxAge != null
                      ? `${kita.minAge} – ${kita.maxAge} Jahre`
                      : kita.minAge != null
                      ? `Ab ${kita.minAge} Jahren`
                      : `Bis ${kita.maxAge} Jahre`
                  }
                />
              )}
              {kita.fee && (
                <DetailRow
                  icon={<Info className="h-4 w-4" />}
                  label="Gebühren"
                  value={kita.fee === "yes" ? "Kostenpflichtig" : kita.fee === "no" ? "Kostenfrei" : kita.fee}
                />
              )}
              {kita.religion && (
                <DetailRow
                  icon={<Tag className="h-4 w-4" />}
                  label="Konfession"
                  value={kita.religion}
                />
              )}
              {kita.wheelchair != null && (
                <DetailRow
                  icon={<Accessibility className="h-4 w-4" />}
                  label="Barrierefreiheit"
                  value={kita.wheelchair ? "Barrierefrei zugänglich" : "Eingeschränkter Zugang"}
                />
              )}
            </div>
          </div>

          {/* Datenquellen Info */}
          <div className="mb-4 rounded-lg border border-border bg-accent/30 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Über diese Daten
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Diese Daten stammen aus <strong className="text-foreground">OpenStreetMap</strong> und werden von der Community gepflegt.
              Viele Felder (Öffnungszeiten, Kapazität, Ansprechpartner) sind oft unvollständig.
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              <strong className="text-foreground">Weitere kostenlose Datenquellen:</strong>{" "}
              Regionale Portale wie KitaFinder (Bayern), KitaNavigator (NRW), Kita-Berlin oder das Portal Ihrer Gemeindeverwaltung
              haben oft aktuellere Daten zu freien Plätzen und Ansprechpartnern.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={osmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-background border border-border px-2.5 py-1 text-xs text-foreground hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                OpenStreetMap
              </a>
              <a
                href={`https://www.openstreetmap.org/edit?node=${kita.osmId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-background border border-border px-2.5 py-1 text-xs text-foreground hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Daten ergänzen
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-background border border-border px-2.5 py-1 text-xs text-foreground hover:bg-accent transition-colors"
              >
                <MapPin className="h-3 w-3" />
                Google Maps
              </a>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              OSM-ID: <code className="font-mono text-foreground">{kita.osmId}</code>
            </p>
          </div>

        </div>

        {/* Footer actions */}
        <div className="border-t border-border bg-card px-5 py-4">
          <button
            onClick={() => onApply(kita)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("apply_btn")}
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            KI generiert ein individuelles Bewerbungsschreiben
          </p>
        </div>
      </div>
    </>
  );
}
