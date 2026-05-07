"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { OverpassKita } from "@/lib/overpass";
import { KitaCard } from "./KitaCard";
import { ApplicationModal } from "./ApplicationModal";
import { KitaDetailModal } from "./KitaDetailModal";
import { AddressAutocomplete } from "./AddressAutocomplete";
import type { AutocompleteResult } from "@/app/api/geocode/autocomplete/route";
import { useTranslations } from "next-intl";
import { Search, Loader2, Filter, Sparkles, LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Dynamically load map to avoid SSR issues with Leaflet
const KitaMap = dynamic(() => import("./KitaMap").then((m) => m.KitaMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-card rounded-lg">
      <Loader2 className="h-6 w-6 animate-spin text-muted" />
    </div>
  ),
});

const KITA_TYPES = ["all", "public", "church", "private", "free"] as const;
const TYPE_LABELS: Record<string, string> = {
  all: "Alle",
  public: "Kommunal",
  church: "Kirchlich",
  private: "Privat",
  free: "Frei",
};

export function SearchClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations("search");
  const [address, setAddress] = useState("");
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5);
  const [kitaType, setKitaType] = useState<string>("all");
  const [kitas, setKitas] = useState<OverpassKita[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedKita, setSelectedKita] = useState<OverpassKita | null>(null);
  const [applyKita, setApplyKita] = useState<OverpassKita | null>(null);
  const [detailKita, setDetailKita] = useState<OverpassKita | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiRanking, setAiRanking] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const geoSearchedRef = useRef(false);

  const searchWithCoords = useCallback(async (lat: number, lng: number, addressLabel: string, searchRadius = radius) => {
    setIsLoading(true);
    setError("");
    setKitas([]);
    setAiRanking("");
    setTotal(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addressLabel, lat, lng, radius: searchRadius, kitaType }),
      });
      if (res.status === 429) { setError(t("free_limit_warning")); return; }
      const data: { kitas?: OverpassKita[]; center?: { lat: number; lng: number }; total?: number; error?: string } = await res.json();
      setKitas(data.kitas ?? []);
      setTotal(data.total ?? data.kitas?.length ?? null);
      if (data.center) setCenter(data.center);
    } catch {
      setError(t("error_generic"));
    } finally {
      setIsLoading(false);
    }
   
  }, [kitaType, radius, t]);

  // Auto-search on mount via browser geolocation
  useEffect(() => {
    if (geoSearchedRef.current) return;
    if (!navigator.geolocation) return;
    geoSearchedRef.current = true;
    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode to get a human-readable label
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`,
            { headers: { "User-Agent": "KitaRadar/1.0 (kitaradar@wamocon.com)" } }
          );
          const data: { address?: { city?: string; town?: string; village?: string; suburb?: string; postcode?: string } } = await res.json();
          const addr = data.address ?? {};
          const label = addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? "Mein Standort";
          setAddress(label);
          setSelectedCoords({ lat: latitude, lng: longitude });
          await searchWithCoords(latitude, longitude, label, radius);
        } catch {
          // Ignore reverse geocode errors
        } finally {
          setIsGeoLoading(false);
        }
      },
      () => { setIsGeoLoading(false); }, // Permission denied or error — fail silently
      { timeout: 8000, maximumAge: 300000 }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setIsLoading(true);
    setError("");
    setKitas([]);
    setAiRanking("");
    setTotal(null);
    try {
      const body = selectedCoords
        ? { address, lat: selectedCoords.lat, lng: selectedCoords.lng, radius, kitaType }
        : { address, radius, kitaType };
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        setError(t("free_limit_warning"));
        return;
      }
      const data: { kitas?: OverpassKita[]; center?: { lat: number; lng: number }; total?: number; error?: string } =
        await res.json();
      if (data.error === "geocode_failed") {
        setError("Adresse nicht gefunden. Bitte überprüfen Sie Ihre Eingabe.");
        return;
      }
      setKitas(data.kitas ?? []);
      setTotal(data.total ?? data.kitas?.length ?? null);
      if (data.center) setCenter(data.center);
    } catch {
      setError(t("error_generic"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAiAssist() {
    if (!kitas.length || !aiQuery.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/search-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitas, preferences: aiQuery }),
      });
      const data: { ranking?: string } = await res.json();
      if (data.ranking) setAiRanking(data.ranking);
    } catch {
      /* ignore */
    } finally {
      setIsAiLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Search bar */}
      <div className="border-b border-border bg-background px-4 py-3">
        <form onSubmit={handleSearch} className="mx-auto flex max-w-4xl flex-wrap gap-2">
          <AddressAutocomplete
              value={address}
              onChange={(v) => {
                setAddress(v);
                setSelectedCoords(null);
              }}
              onSelect={(result: AutocompleteResult) => {
                setSelectedCoords({ lat: result.lat, lng: result.lng });
              }}
            />

          {/* Geolocation button */}
          <button
            type="button"
            title="Meinen Standort verwenden"
            disabled={isGeoLoading || isLoading}
            onClick={() => {
              if (!navigator.geolocation) return;
              setIsGeoLoading(true);
              navigator.geolocation.getCurrentPosition(
                async (pos) => {
                  const { latitude, longitude } = pos.coords;
                  try {
                    const res = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`,
                      { headers: { "User-Agent": "KitaRadar/1.0 (kitaradar@wamocon.com)" } }
                    );
                    const data: { address?: { city?: string; town?: string; village?: string; suburb?: string } } = await res.json();
                    const addr = data.address ?? {};
                    const label = addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? "Mein Standort";
                    setAddress(label);
                    setSelectedCoords({ lat: latitude, lng: longitude });
                    await searchWithCoords(latitude, longitude, label, radius);
                  } catch {
                    /* ignore */
                  } finally {
                    setIsGeoLoading(false);
                  }
                },
                () => setIsGeoLoading(false),
                { timeout: 8000, maximumAge: 300000 }
              );
            }}
            className="flex items-center justify-center rounded-md border border-border bg-card px-2.5 py-2 text-muted hover:border-primary/50 hover:text-primary disabled:opacity-50 transition-colors"
          >
            {isGeoLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <LocateFixed className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted" />
            <select
              value={[1, 2, 5, 10, 20].includes(radius) ? radius : "custom"}
              onChange={(e) => {
                if (e.target.value !== "custom") setRadius(Number(e.target.value));
              }}
              className="rounded-md border border-border bg-card px-2 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {[1, 2, 5, 10, 20].map((r) => (
                <option key={r} value={r}>{r} km</option>
              ))}
              <option value="custom">Eigener…</option>
            </select>
            {![1, 2, 5, 10, 20].includes(radius) && (
              <input
                type="number"
                min={1}
                max={100}
                value={radius}
                onChange={(e) => {
                  const v = Math.min(Math.max(Number(e.target.value) || 1, 1), 100);
                  setRadius(v);
                }}
                className="w-16 rounded-md border border-border bg-card px-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            )}
          </div>

          <div className="flex gap-1">
            {KITA_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setKitaType(type)}
                className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  kitaType === type
                    ? "bg-primary text-white"
                    : "border border-border text-muted hover:border-primary/50"
                }`}
              >
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Suchen
          </button>
        </form>

        {error && (
          <p className="mx-auto mt-2 max-w-4xl rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: kita list */}
        <div className="flex w-80 shrink-0 flex-col overflow-hidden border-r border-border">
          {/* AI assist */}
          {isLoggedIn && kitas.length > 0 && (
            <div className="border-b border-border bg-primary/5 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="KI: z.B. 'Nähe zur Arbeit, bio-Ernährung'..."
                  className="flex-1 rounded-md border border-border bg-card px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                />
                <button
                  onClick={handleAiAssist}
                  disabled={isAiLoading}
                  className="flex items-center gap-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {isAiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  KI
                </button>
              </div>
              {aiRanking && (
                <div className="mt-2 rounded-md bg-background p-2 text-xs text-foreground whitespace-pre-wrap">
                  {aiRanking}
                </div>
              )}
            </div>
          )}

          {/* Results count */}
          {kitas.length > 0 && (
            <div className="border-b border-border bg-card px-3 py-2 text-xs text-muted">
              {kitas.length} Einrichtungen
              {total !== null && total > kitas.length && (
                <span> (von {total} – nach Entfernung sortiert)</span>
              )}
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
          {kitas.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted">
                <Search className="h-8 w-8 opacity-30" />
                {isGeoLoading
                  ? <p>Standort wird ermittelt…</p>
                  : <p>Geben Sie eine Adresse ein und klicken Sie auf &quot;Suchen&quot;.</p>
                }
              </div>
            )}
            <div className="space-y-2 p-3">
              {kitas.map((kita) => (
                <KitaCard
                  key={kita.id}
                  kita={kita}
                  selected={selectedKita?.id === kita.id}
                  onSelect={() => { setSelectedKita(kita); setDetailKita(kita); }}
                  onApply={() => setApplyKita(kita)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Map */}
        <div className="flex-1 p-2">
          {center ? (
            <KitaMap
              kitas={kitas}
              center={center}
              selectedId={selectedKita?.id}
              onSelect={(kita) => { setSelectedKita(kita); setDetailKita(kita); }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg bg-card text-muted">
              <Search className="h-12 w-12 opacity-20" />
              <p className="text-sm">Karte erscheint nach der Suche</p>
            </div>
          )}
        </div>
      </div>

      {applyKita && (
        <ApplicationModal kita={applyKita} onClose={() => setApplyKita(null)} />
      )}

      <KitaDetailModal
        kita={detailKita}
        onClose={() => setDetailKita(null)}
        onApply={(kita) => { setDetailKita(null); setApplyKita(kita); }}
      />
    </div>
  );
}
