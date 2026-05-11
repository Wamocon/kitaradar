"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { OverpassKita } from "@/lib/overpass";
import { useTranslations, useLocale } from "next-intl";
import {
  X,
  Sparkles,
  CheckCircle2,
  Pencil,
  Eye,
  Mail,
  FileText,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

interface ApplicationModalProps {
  kita: OverpassKita;
  onClose: () => void;
}

type SavedState = "none" | "sent" | "draft";

export function ApplicationModal({ kita, onClose }: ApplicationModalProps) {
  const t = useTranslations("application");
  const locale = useLocale();
  const [coverLetter, setCoverLetter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedState, setSavedState] = useState<SavedState>("none");
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

  async function saveApplication(status: "sent" | "draft"): Promise<boolean> {
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kita_name: kita.name,
          kita_email: kita.email,
          cover_letter: coverLetter,
          status,
        }),
      });
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(data.error ?? t("error"));
      }
      setSavedState(status);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function openMailto() {
    const subject = encodeURIComponent(`Bewerbung um einen Kita-Platz - ${kita.name}`);
    const body = encodeURIComponent(
      coverLetter ||
        "Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich um einen Kita-Platz.\n\nMit freundlichen Gruessen"
    );
    window.open(`mailto:${kita.email}?subject=${subject}&body=${body}`, "_blank");
    await saveApplication("sent");
  }

  const progressPct = Math.min((elapsed / 90) * 100, 95);
  const statusText =
    elapsed < 5
      ? "KI analysiert und formuliert..."
      : elapsed < 30
        ? `Anschreiben wird verfasst - ${elapsed}s`
        : `Detailliertes Anschreiben in Arbeit - ${elapsed}s`;

  const applicationsHref = `/${locale}/applications`;

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
        {isDone && !isGenerating && coverLetter && savedState === "none" && (
          <div className="flex items-center gap-2 rounded-t-2xl bg-green-50 px-5 py-2.5 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Anschreiben erfolgreich generiert – Sie können es unten bearbeiten.
          </div>
        )}

        {/* ── SUCCESS STATE ─────────────────────────────────────────────── */}
        {savedState !== "none" && (
          <>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold text-foreground">{kita.name}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Success body */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-10 text-center">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
                savedState === "sent" ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"
              }`}>
                {savedState === "sent"
                  ? <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                  : <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                }
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {savedState === "sent" ? t("saved_sent_title") : t("saved_draft_title")}
                </h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  {savedState === "sent" ? t("saved_sent_desc") : t("saved_draft_desc")}
                </p>
              </div>
              {savedState === "sent" && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-2.5 text-sm">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="font-medium text-blue-700 dark:text-blue-300">Status: Eingereicht</span>
                  <span className="text-xs text-blue-500 dark:text-blue-400">· jederzeit änderbar</span>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={applicationsHref}
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  {t("to_applications")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {t("close_modal")}
                </button>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ExternalLink className="h-3.5 w-3.5" />
                Unter <strong className="mx-0.5">Bewerbungen</strong> können Sie Status, Notizen und Rückmeldungen pflegen.
              </p>
            </div>
          </>
        )}

        {/* ── NORMAL STATE ──────────────────────────────────────────────── */}
        {savedState === "none" && (
          <>
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
                {isSaving ? "Speichert…" : t("save_draft")}
              </button>
              {kita.email ? (
                <button
                  onClick={openMailto}
                  disabled={isSaving}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSaving ? "Speichert…" : t("send_email")}
                </button>
              ) : (
                <div className="flex flex-1 flex-col gap-1.5">
                  <button
                    onClick={() => saveApplication("sent")}
                    disabled={isSaving}
                    className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSaving ? "Speichert…" : t("mark_sent")}
                  </button>
                  <p className="text-center text-xs text-muted-foreground">{t("no_email")}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
