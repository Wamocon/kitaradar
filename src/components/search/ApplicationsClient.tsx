"use client";

import { useState } from "react";
import {
  FileText,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";

interface Application {
  id: string;
  kita_name: string;
  kita_email: string | null;
  status: string;
  cover_letter: string | null;
  notes: string | null;
  response_at: string | null;
  sent_at: string | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "draft",             label: "Entwurf",          icon: FileText,    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700" },
  { value: "sent",              label: "Eingereicht",       icon: Mail,        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
  { value: "waiting",           label: "Warteliste",        icon: Clock,       color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800" },
  { value: "response_received", label: "Rückmeldung",       icon: CheckCircle2,color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800" },
  { value: "positive",          label: "Zusage",            icon: CheckCircle2,color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
  { value: "rejected",          label: "Abgelehnt",         icon: XCircle,     color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800" },
] as const;

function statusMeta(value: string) {
  return STATUS_OPTIONS.find((s) => s.value === value) ?? STATUS_OPTIONS[0];
}

interface ApplicationsClientProps {
  initialApplications: Application[];
}

export function ApplicationsClient({ initialApplications }: ApplicationsClientProps) {
  const [apps, setApps] = useState<Application[]>(initialApplications);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [showLetter, setShowLetter] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setSaving((p) => ({ ...p, [id]: true }));
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Fehler beim Speichern");
      const data: { application: Application } = await res.json();
      setApps((prev) => prev.map((a) => (a.id === id ? data.application : a)));
    } catch {
      setError("Status konnte nicht gespeichert werden.");
    } finally {
      setSaving((p) => ({ ...p, [id]: false }));
    }
  }

  async function saveNotes(id: string) {
    setSaving((p) => ({ ...p, [id + "_notes"]: true }));
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notes: editingNotes[id] ?? "" }),
      });
      if (!res.ok) throw new Error("Fehler beim Speichern");
      const data: { application: Application } = await res.json();
      setApps((prev) => prev.map((a) => (a.id === id ? data.application : a)));
    } catch {
      setError("Notizen konnten nicht gespeichert werden.");
    } finally {
      setSaving((p) => ({ ...p, [id + "_notes"]: false }));
    }
  }

  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
        <FileText className="mb-4 h-10 w-10 text-muted-foreground" />
        <p className="text-base font-medium text-foreground">Noch keine Bewerbungen</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Starten Sie eine Suche und bewerben Sie sich direkt aus der Kartenansicht.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {apps.map((app) => {
        const meta = statusMeta(app.status);
        const StatusIcon = meta.icon;
        const isExpanded = expandedId === app.id;
        const noteVal = editingNotes[app.id] ?? app.notes ?? "";
        const notesDirty = editingNotes[app.id] !== undefined && editingNotes[app.id] !== (app.notes ?? "");

        return (
          <div key={app.id} className="rounded-xl border border-border bg-card shadow-sm">
            {/* Header row */}
            <button
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              onClick={() => setExpandedId(isExpanded ? null : app.id)}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{app.kita_name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(app.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
                  {app.kita_email && <> · {app.kita_email}</>}
                </p>
              </div>
              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${meta.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
              {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-border px-5 py-4 space-y-5">

                {/* Status selector */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status ändern</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const OIcon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          disabled={saving[app.id]}
                          onClick={() => updateStatus(app.id, opt.value)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                            app.status === opt.value
                              ? opt.color + " ring-2 ring-primary/40"
                              : "border-border bg-background text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          <OIcon className="h-3.5 w-3.5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Notizen / Rückmeldung
                  </p>
                  <textarea
                    rows={3}
                    value={noteVal}
                    onChange={(e) => setEditingNotes((p) => ({ ...p, [app.id]: e.target.value }))}
                    placeholder="Eigene Notizen, Rückmeldung der Kita, Gesprächsdatum…"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  {notesDirty && (
                    <button
                      disabled={saving[app.id + "_notes"]}
                      onClick={() => saveNotes(app.id)}
                      className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Pencil className="h-3 w-3" />
                      {saving[app.id + "_notes"] ? "Speichert…" : "Notizen speichern"}
                    </button>
                  )}
                </div>

                {/* Cover letter */}
                {app.cover_letter && (
                  <div>
                    <button
                      onClick={() => setShowLetter((p) => ({ ...p, [app.id]: !p[app.id] }))}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                    >
                      {showLetter[app.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showLetter[app.id] ? "Anschreiben ausblenden" : "Anschreiben anzeigen"}
                    </button>
                    {showLetter[app.id] && (
                      <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs text-foreground leading-relaxed">
                        {app.cover_letter}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
