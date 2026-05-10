"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  MapPin,
  Loader2,
  Lock,
  AlertCircle,
  Star,
  Baby,
  Clock,
  BookOpen,
  Heart,
  ChevronRight,
} from "lucide-react";
import { AiProgressToast } from "@/components/ui/AiProgressToast";

interface Child {
  id: string;
  name: string;
  birth_year: number | null;
  birth_month: number | null;
  special_needs: string | null;
}

interface Profile {
  full_name: string | null;
  subscription_tier: string | null;
  default_search_city: string | null;
  default_search_radius: number | null;
  preferred_pedagogy: string | null;
  preferred_kita_type: string | null;
  preferred_languages: string | null;
  preferred_hours: string | null;
}

interface Recommendation {
  name: string;
  address: string;
  kitaType: string;
  distance: string;
  matchScore: number;
  reasons: string[];
  strengths: string[];
  considerations: string[];
  osmId?: string;
}

interface RecommendationsClientProps {
  isPro: boolean;
  profile: Profile | null;
  userChildren: Child[];
}

const PEDAGOGY_LABELS: Record<string, string> = {
  montessori: "Montessori",
  waldorf: "Waldorf",
  reggio: "Reggio",
  situationsansatz: "Situationsansatz",
  pikler: "Pikler",
};

const TYPE_LABELS: Record<string, string> = {
  public: "Kommunal",
  church: "Kirchlich",
  private: "Privat",
  free: "Freier Träger",
};

const HOURS_LABELS: Record<string, string> = {
  halbtags: "Halbtags",
  nachmittags: "Nachmittags",
  ganztags: "Ganztags",
  erweitert: "Erweiterte Betreuung",
};

function getAge(birthYear: number | null, birthMonth: number | null): string {
  if (!birthYear) return "Unbekannt";
  const now = new Date();
  const months = (now.getFullYear() - birthYear) * 12 + now.getMonth() - (birthMonth ?? 1) + 1;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} Monate`;
  if (remainingMonths === 0) return `${years} Jahre`;
  return `${years} J. ${remainingMonths} M.`;
}

export function RecommendationsClient({ isPro, profile, userChildren }: RecommendationsClientProps) {
  const [selectedChild, setSelectedChild] = useState<Child | null>(userChildren[0] ?? null);
  const [searchCity, setSearchCity] = useState(profile?.default_search_city ?? "");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isToastComplete, setIsToastComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const hasPreferences =
    profile?.preferred_pedagogy ||
    profile?.preferred_kita_type ||
    profile?.preferred_languages ||
    profile?.preferred_hours;

  async function generateRecommendations() {
    if (!searchCity.trim()) {
      setError("Bitte geben Sie einen Suchort ein.");
      return;
    }
    setLoading(true);
    setIsToastComplete(false);
    setError(null);
    try {
      const res = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: searchCity,
          child: selectedChild,
          preferences: {
            pedagogy: profile?.preferred_pedagogy,
            kitaType: profile?.preferred_kita_type,
            languages: profile?.preferred_languages,
            hours: profile?.preferred_hours,
          },
          radius: profile?.default_search_radius ?? 5,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Fehler bei der KI-Anfrage");
      }
      const data: { recommendations: Recommendation[] } = await res.json();
      setRecommendations(data.recommendations);
      setGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsToastComplete(true);
      setLoading(false);
    }
  }

  if (!isPro) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <Lock className="h-7 w-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Pro-Feature</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          KI-Kita-Empfehlungen sind im Pro-Tarif verfügbar. Upgraden Sie jetzt und erhalten Sie
          personalisierte Vorschläge basierend auf Ihrem Kinderprofil.
        </p>
        <Link
          href="/pricing"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Jetzt auf Pro upgraden
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      {/* Configuration Panel */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Empfehlungsparameter</h2>

        {/* Child selection */}
        {userChildren.length > 0 ? (
          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">Kind auswählen</label>
            <div className="flex flex-wrap gap-2">
              {userChildren.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedChild?.id === child.id
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  <Baby className="h-3.5 w-3.5" />
                  {child.name}
                  <span className="text-xs text-muted-foreground">
                    ({getAge(child.birth_year, child.birth_month)})
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent/50 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Kein Kinderprofil vorhanden.{" "}
              <Link href="/profile" className="text-primary hover:underline">
                Jetzt in den Einstellungen anlegen →
              </Link>
            </p>
          </div>
        )}

        {/* Search city */}
        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> Suchort
          </label>
          <input
            type="text"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            placeholder="z.B. Frankfurt am Main, Berlin Mitte"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Active preferences summary */}
        {hasPreferences && (
          <div className="mb-4 flex flex-wrap gap-2">
            {profile?.preferred_pedagogy && (
              <span className="flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/30 px-2.5 py-1 text-xs text-violet-700 dark:text-violet-300">
                <BookOpen className="h-3 w-3" />
                {PEDAGOGY_LABELS[profile.preferred_pedagogy] ?? profile.preferred_pedagogy}
              </span>
            )}
            {profile?.preferred_kita_type && (
              <span className="flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-xs text-blue-700 dark:text-blue-300">
                {TYPE_LABELS[profile.preferred_kita_type] ?? profile.preferred_kita_type}
              </span>
            )}
            {profile?.preferred_hours && (
              <span className="flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-xs text-green-700 dark:text-green-300">
                <Clock className="h-3 w-3" />
                {HOURS_LABELS[profile.preferred_hours] ?? profile.preferred_hours}
              </span>
            )}
            {profile?.preferred_languages && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300">
                🌍 {profile.preferred_languages}
              </span>
            )}
          </div>
        )}

        {!hasPreferences && (
          <p className="mb-4 rounded-lg bg-accent/50 px-3 py-2 text-xs text-muted-foreground">
            💡 Legen Sie Ihre{" "}
            <Link href="/profile" className="text-primary hover:underline">
              KI-Präferenzen im Profil
            </Link>{" "}
            fest, um präzisere Empfehlungen zu erhalten.
          </p>
        )}

        {error && (
          <p className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button
          onClick={generateRecommendations}
          disabled={loading || !searchCity.trim()}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              KI analysiert Kitas…
              <span className="text-xs font-normal opacity-75">– läuft im Hintergrund</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Empfehlungen generieren
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {generated && recommendations.length === 0 && !loading && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Keine passenden Kitas gefunden. Probieren Sie einen anderen Ort oder erweitern Sie den Suchradius.</p>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            {recommendations.length} Empfehlungen für{" "}
            <span className="text-primary">{selectedChild?.name ?? "Ihr Kind"}</span> in{" "}
            <span className="text-primary">{searchCity}</span>
          </h2>
          {recommendations.map((rec, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <h3 className="font-semibold text-foreground">{rec.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {rec.address}
                    {rec.distance && <span className="ml-1 text-primary">· {rec.distance}</span>}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${s <= Math.round(rec.matchScore / 20) ? "text-yellow-400 fill-yellow-400" : "text-zinc-300 dark:text-zinc-600"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rec.matchScore}% Match
                  </p>
                </div>
              </div>

              {/* Reasons */}
              {rec.reasons.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">Warum diese Kita?</p>
                  <ul className="space-y-1">
                    {rec.reasons.map((reason, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-foreground">
                        <span className="mt-0.5 text-primary">✓</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {rec.strengths.map((s, j) => (
                  <span key={j} className="flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs text-green-700 dark:text-green-300">
                    <Heart className="h-3 w-3" /> {s}
                  </span>
                ))}
              </div>

              {rec.considerations.length > 0 && (
                <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <strong>Zu beachten:</strong> {rec.considerations.join(" · ")}
                  </p>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <Link
                  href={`/search?city=${encodeURIComponent(rec.name)}`}
                  className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Auf Karte suchen
                </Link>
                <Link
                  href={`/search?q=${encodeURIComponent(rec.name)}&city=${encodeURIComponent(searchCity)}`}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                >
                  Bewerben
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

      <AiProgressToast
        visible={loading || isToastComplete}
        isComplete={isToastComplete}
        label="KI analysiert Kitas…"
        completeLabel="Empfehlungen fertig!"
        onDismiss={() => setIsToastComplete(false)}
      />
    </>
  );
}