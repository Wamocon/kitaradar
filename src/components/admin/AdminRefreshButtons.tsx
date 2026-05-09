"use client";

import { useState } from "react";
import { RefreshCw, Trash2, Loader2, CheckCircle2 } from "lucide-react";

interface AdminRefreshButtonsProps {
  staleCount: number;
}

export function AdminRefreshButtons({ staleCount }: AdminRefreshButtonsProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  async function runAction(action: string, endpoint: string, method = "POST") {
    setLoadingAction(action);
    try {
      const res = await fetch(endpoint, { method });
      const data: { message?: string; error?: string; refreshed?: number; deleted?: number } = await res.json();
      if (res.ok) {
        setResults((prev) => ({ ...prev, [action]: data.message ?? "Erfolgreich" }));
      } else {
        setResults((prev) => ({ ...prev, [action]: `Fehler: ${data.error ?? "Unbekannt"}` }));
      }
    } catch {
      setResults((prev) => ({ ...prev, [action]: "Netzwerkfehler" }));
    } finally {
      setLoadingAction(null);
    }
  }

  const actions = [
    {
      id: "refresh-stale",
      label: "Veraltete Enrichments erneuern",
      description: `${staleCount} Einträge älter als 72h werden neu abgerufen (mit Rate-Limiting)`,
      icon: RefreshCw,
      accent: "blue",
      onClick: () => runAction("refresh-stale", "/api/admin/refresh/enrichments"),
    },
    {
      id: "clear-stale",
      label: "Veralteten Cache leeren",
      description: "Entfernt alle Enrichment-Einträge älter als 72h aus der Datenbank",
      icon: Trash2,
      accent: "amber",
      onClick: () => runAction("clear-stale", "/api/admin/refresh/enrichments/clear", "DELETE"),
    },
  ] as const;

  const accentMap = {
    blue: {
      btn: "bg-primary text-white hover:bg-primary/90",
      icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    amber: {
      btn: "border border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20",
      icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    },
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {actions.map(({ id, label, description, icon: Icon, accent, onClick }) => (
        <div key={id} className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-start gap-3">
            <div className={`rounded-lg p-2 ${accentMap[accent].icon}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          {results[id] && (
            <p className="mb-2 flex items-center gap-1.5 rounded-md bg-green-50 dark:bg-green-900/20 px-2.5 py-1.5 text-xs text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {results[id]}
            </p>
          )}
          <button
            onClick={onClick}
            disabled={loadingAction !== null}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${accentMap[accent].btn}`}
          >
            {loadingAction === id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {loadingAction === id ? "Läuft…" : label}
          </button>
        </div>
      ))}
    </div>
  );
}
