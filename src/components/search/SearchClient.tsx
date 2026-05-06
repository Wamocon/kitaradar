"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { OverpassKita } from "@/lib/overpass";
import { KitaCard } from "./KitaCard";
import { ApplicationModal } from "./ApplicationModal";
import { useTranslations } from "next-intl";
import { Search, Loader2, Filter, Sparkles } from "lucide-react";
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
  const t = useTranslations("common");
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState(5);
  const [kitaType, setKitaType] = useState<string>("all");
  const [kitas, setKitas] = useState<OverpassKita[]>([]);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedKita, setSelectedKita] = useState<OverpassKita | null>(null);
  const [applyKita, setApplyKita] = useState<OverpassKita | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiRanking, setAiRanking] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;

    setIsLoading(true);
    setError("");
    setKitas([]);
    setAiRanking("");

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, radius, kitaType }),
      });

      if (res.status === 429) {
        setError(t("search_limit_reached"));
        return;
      }

      const data: { kitas?: OverpassKita[]; center?: { lat: number; lng: number }; error?: string } =
        await res.json();

      if (data.error === "geocode_failed") {
        setError("Adresse nicht gefunden. Bitte überprüfen Sie Ihre Eingabe.");
        return;
      }

      setKitas(data.kitas ?? []);
      if (data.center) setCenter(data.center);
    } catch {
      setError(t("error"));
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
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Adresse oder PLZ eingeben..."
              className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted" />
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="rounded-md border border-border bg-card px-2 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {[1, 2, 5, 10, 20].map((r) => (
                <option key={r} value={r}>{r} km</option>
              ))}
            </select>
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
              {kitas.length} Einrichtungen gefunden
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {kitas.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted">
                <Search className="h-8 w-8 opacity-30" />
                <p>Geben Sie eine Adresse ein und klicken Sie auf &quot;Suchen&quot;.</p>
              </div>
            )}
            <div className="space-y-2 p-3">
              {kitas.map((kita) => (
                <KitaCard
                  key={kita.id}
                  kita={kita}
                  selected={selectedKita?.id === kita.id}
                  onSelect={() => setSelectedKita(kita)}
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
              onSelect={setSelectedKita}
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
    </div>
  );
}
