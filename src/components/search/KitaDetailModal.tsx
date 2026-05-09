"use client";

import { useEffect, useState } from "react";
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
  Star,
  ChevronLeft,
  Loader2,
  MessageSquare,
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

interface EnrichmentData {
  google_rating: number | null;
  google_ratings_count: number;
  photoUrls: string[];
  google_reviews: Array<{ author: string; rating: number; text: string; time: string }>;
  wikidata_desc: string | null;
  website: string | null;
  phone: string | null;
  opening_hours: string | null;
}

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

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-bold text-foreground">{rating.toFixed(1)}</span>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${i <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-zinc-300 dark:text-zinc-600"}`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
}

function PhotoGallery({ urls }: { urls: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!urls.length) return null;
  return (
    <div className="relative mb-4 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800" style={{ height: 200 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[idx]}
        alt={`Kita Foto ${idx + 1}`}
        className="h-full w-full object-cover"
      />
      {urls.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + urls.length) % urls.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % urls.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 w-1.5 rounded-full transition ${i === idx ? "bg-white" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
      <div className="absolute top-2 right-2 rounded-md bg-black/50 px-2 py-0.5 text-xs text-white">
        Foto: Google
      </div>
    </div>
  );
}

export function KitaDetailModal({ kita, onClose, onApply }: KitaDetailModalProps) {
  const t = useTranslations("search");
  const [enrichment, setEnrichment] = useState<EnrichmentData | null>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fetch enrichment data when kita changes
  useEffect(() => {
    if (!kita) return;
    const currentKita = kita;
    async function fetchEnrichment() {
      setEnrichment(null);
      setEnrichLoading(true);
      try {
        const r = await fetch(
          `/api/kita/${currentKita.osmId}/enrich?name=${encodeURIComponent(currentKita.name)}&lat=${currentKita.lat}&lng=${currentKita.lng}`
        );
        setEnrichment(r.ok ? await r.json() : null);
      } catch {
        setEnrichment(null);
      } finally {
        setEnrichLoading(false);
      }
    }
    void fetchEnrichment();
  }, [kita]);

  if (!kita) return null;

  const osmUrl = `https://www.openstreetmap.org/node/${kita.osmId}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${kita.lat},${kita.lng}`;
  const fullAddress = [kita.address, kita.postalCode, kita.city].filter(Boolean).join(", ");

  // Merge enrichment with OSM data (prefer OSM for existing fields)
  const phone = kita.phone ?? enrichment?.phone ?? null;
  const website = kita.website ?? enrichment?.website ?? null;
  const openingHours = kita.openingHours ?? enrichment?.opening_hours ?? null;

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
            <div className="mt-1 flex items-center gap-3">
              {kita.distanceKm != null && (
                <p className="text-xs text-muted-foreground">{kita.distanceKm} km entfernt</p>
              )}
              {enrichment?.google_rating && (
                <StarRating rating={enrichment.google_rating} count={enrichment.google_ratings_count} />
              )}
              {enrichLoading && !enrichment && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
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

          {/* Photo Gallery (Google) */}
          {enrichment?.photoUrls && enrichment.photoUrls.length > 0 && (
            <PhotoGallery urls={enrichment.photoUrls} />
          )}

          {/* Description — Wikidata or OSM */}
          {(enrichment?.wikidata_desc ?? kita.description) && (
            <div className="mb-4 rounded-lg bg-accent/50 px-4 py-3">
              <p className="flex items-start gap-2 text-sm text-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {enrichment?.wikidata_desc ?? kita.description}
              </p>
              {enrichment?.wikidata_desc && (
                <p className="mt-1.5 text-xs text-muted-foreground">Quelle: Wikidata</p>
              )}
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
              {phone && (
                <DetailRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Telefon"
                  value={phone}
                  href={`tel:${phone}`}
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
              {website && (
                <DetailRow
                  icon={<Globe className="h-4 w-4" />}
                  label="Website"
                  value={website.replace(/^https?:\/\//, "")}
                  href={website.startsWith("http") ? website : `https://${website}`}
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
              {openingHours && (
                <DetailRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Öffnungszeiten"
                  value={openingHours}
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

          {/* Google Bewertungen */}
          {enrichment?.google_reviews && enrichment.google_reviews.length > 0 && (
            <div className="mb-4">
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                Bewertungen (Google)
              </h3>
              <div className="space-y-2">
                {enrichment.google_reviews.map((review, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-foreground">{review.author}</span>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-300"}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">{review.time}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{review.text}</p>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Bewertungen von Google Places</p>
            </div>
          )}

          {/* Datenquellen Info */}
          <div className="mb-4 rounded-lg border border-border bg-accent/30 p-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Über diese Daten
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Diese Daten stammen aus <strong className="text-foreground">OpenStreetMap</strong>,{" "}
              {enrichment?.google_rating ? <><strong className="text-foreground">Google Places</strong> und </> : null}
              {enrichment?.wikidata_desc ? <><strong className="text-foreground">Wikidata</strong> und </> : null}
              werden von der Community gepflegt.
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

