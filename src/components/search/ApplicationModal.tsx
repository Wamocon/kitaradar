"use client";

import { useState, useEffect, useRef } from "react";
import type { OverpassKita } from "@/lib/overpass";
import { useTranslations } from "next-intl";
import { X, Sparkles, CheckCircle2, Pencil, Eye } from "lucide-react";

interface ApplicationModalProps {
  kita: OverpassKita;
  onClose: () => void;
}

export function ApplicationModal({ kita, onClose }: ApplicationModalProps) {
  const t = useTranslations("application");
  const [coverLetter, setCoverLetter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!isGenerating) return;
    startTimeRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isGenerating]);

  async function generateLetter() {
    setIsGenerating(true);
    setIsDone(false);
    setElapsed(0);
    setError("");
    try {
      const res = await fetch("/api/ai/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kitaName: kita.name,
          kitaAddress: `${kita.address} ${kita.city}`.trim(),
        }),
      });
      if (res.status === 401) {
        setError("Bitte melden Sie sich an, um die KI-Funktion zu nutzen.");
        return;
      }
      if (res.status === 503) {
        setError("KI-Funktion derzeit nicht verfügbar.");
        return;
      }
      const data: { letter?: string; error?: string } = await res.json();
      if (data.letter) {
        setCoverLetter(data.letter);
        setEditMode(false);
      }
    } catch {
      setError("Fehler bei der KI-Generierung.");
    } finally {
      setIsGenerating(false);
      setIsDone(true);
    }
  }

  async function saveApplication(status: "sent" | "draft") {
    setIsSaving(true);
    setError("");
    try {
      await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kita_name: kita.name,
          kita_email: kita.email,
          cover_letter: coverLetter,
          status,
        }),
      });
      setSaved(true);
    } catch {
      setError(t("error"));
    } finally {
      setIsSaving(false);
    }
  }

  function openMailto() {
    if (!kita.email) return;
    const subject = encodeURIComponent(`Bewerbung um einen Kita-Platz - ${kita.name}`);
    const body = encodeURIComponent(
      coverLetter ||
        "Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich um einen Kita-Platz.\n\nMit freundlichen Gruessen"
    );
    window.open(`mailto:${kita.email}?subject=${subject}&body=${body}`, "_blank");
    saveApplication("sent");
  }

  const progressPct = Math.min((elapsed / 90) * 100, 95);
  const statusText =
    elapsed < 5
      ? "KI analysiert und formuliert..."
      : elapsed < 30
        ? `Anschreiben wird verfasst - ${elapsed}s`
        : `Detailliertes Anschreiben in Arbeit - ${elapsed}s`;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-3 sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex h-full max-h-[95vh] w-full max-w-4xl flex-col rounded-2xl bg-card shadow-2xl">

        {/* Full-modal loading overlay */}
        {isGenerating && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 rounded-2xl bg-card/97">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-border border-t-primary" />
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <div className="w-full max-w-sm space-y-4 px-8 text-center">
              <p className="text-lg font-semibold text-foreground">KI erstellt Ihr Anschreiben</p>
              <p className="text-sm text-muted-foreground">
                Fuer <span className="font-medium text-foreground">{kita.name}</span>
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{statusText}</p>
            </div>
            <p className="max-w-xs text-center text-xs text-muted-foreground">
              Das Modell verfasst ein individuelles, professionelles Anschreiben.
              Dies kann bis zu 2 Minuten dauern.
            </p>
          </div>
        )}

        {/* Done banner */}
        {isDone && !isGenerating && coverLetter && (
          <div className="flex items-center gap-2 rounded-t-2xl bg-green-50 px-5 py-2.5 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Anschreiben erfolgreich generiert - Sie koennen es unten bearbeiten.
          </div>
        )}

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {t("modal_title", { kita: kita.name })}
            </h2>
            {kita.address && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {kita.address}{kita.city ? `, ${kita.city}` : ""}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
          {saved && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {t("status_sent")}
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex flex-1 flex-col">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                {t("cover_letter")}
              </label>
              {coverLetter && (
                <button
                  onClick={() => setEditMode((m) => !m)}
                  className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {editMode ? (
                    <><Eye className="h-3.5 w-3.5" /> Vorschau</>
                  ) : (
                    <><Pencil className="h-3.5 w-3.5" /> Bearbeiten</>
                  )}
                </button>
              )}
            </div>

            {!editMode && coverLetter ? (
              <div className="min-h-64 flex-1 overflow-y-auto rounded-xl border border-border bg-background px-6 py-5 font-serif">
                {coverLetter.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="mb-5 text-sm leading-7 text-foreground last:mb-0">
                    {paragraph.split("\n").map((line, j, arr) => (
                      <span key={j}>
                        {line}
                        {j < arr.length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            ) : (
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder={t("cover_letter_placeholder")}
                className="min-h-64 flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            )}
          </div>

          <p className="text-xs text-muted-foreground">{t("ai_hint")}</p>

          <button
            onClick={generateLetter}
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {coverLetter ? "Anschreiben neu generieren" : t("ai_generate")}
          </button>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col gap-2 border-t border-border px-5 py-4 sm:flex-row">
          <button
            onClick={() => saveApplication("draft")}
            disabled={isSaving}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {t("save_draft")}
          </button>
          {kita.email ? (
            <button
              onClick={openMailto}
              disabled={isSaving}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {t("send_email")}
            </button>
          ) : (
            <p className="flex-1 rounded-xl bg-muted/30 px-4 py-2.5 text-center text-xs text-muted-foreground">
              {t("no_email")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
