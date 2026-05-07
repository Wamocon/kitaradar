"use client";

import { useState } from "react";
import type { OverpassKita } from "@/lib/overpass";
import { useTranslations } from "next-intl";
import { X, Loader2 } from "lucide-react";

interface ApplicationModalProps {
  kita: OverpassKita;
  onClose: () => void;
}

export function ApplicationModal({ kita, onClose }: ApplicationModalProps) {
  const t = useTranslations("application");
  const [coverLetter, setCoverLetter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function generateLetter() {
    setIsGenerating(true);
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
      if (data.letter) setCoverLetter(data.letter);
    } catch {
      setError("Fehler bei der KI-Generierung.");
    } finally {
      setIsGenerating(false);
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
    const subject = encodeURIComponent(`Bewerbung um einen Kita-Platz – ${kita.name}`);
    const body = encodeURIComponent(coverLetter || "Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich um einen Kita-Platz.\n\nMit freundlichen Grüßen");
    window.open(`mailto:${kita.email}?subject=${subject}&body=${body}`, "_blank");
    saveApplication("sent");
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-semibold text-foreground">
            {t("modal_title", { kita: kita.name })}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-4">
          {saved && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {t("status_sent")}
            </p>
          )}

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              {t("cover_letter")}
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={8}
              placeholder={t("cover_letter_placeholder")}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <p className="text-xs text-muted">{t("ai_hint")}</p>

          <button
            onClick={generateLetter}
            disabled={isGenerating}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("ai_generating")}
              </>
            ) : (
              t("ai_generate")
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 border-t border-border p-4 sm:flex-row">
          <button
            onClick={() => saveApplication("draft")}
            disabled={isSaving}
            className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-border/40 disabled:opacity-50 transition-colors"
          >
            {t("save_draft")}
          </button>

          {kita.email ? (
            <button
              onClick={openMailto}
              disabled={isSaving}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {t("send_email")}
            </button>
          ) : (
            <p className="flex-1 rounded-md bg-muted/20 px-4 py-2 text-center text-xs text-muted">
              {t("no_email")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
