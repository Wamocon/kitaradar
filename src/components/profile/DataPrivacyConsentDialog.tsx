"use client";

import Link from "next/link";
import { Shield, Lock, ChevronRight, X, AlertTriangle } from "lucide-react";

interface DataPrivacyConsentDialogProps {
  onAccept: () => void;
  onDecline: () => void;
  context: "extended_profile" | "ai_preferences";
}

const TEXTS = {
  extended_profile: {
    title: "Datenschutz-Einwilligung",
    subtitle: "Erweiterte Eltern- und Familiendaten",
    intro:
      "Sie sind dabei, erweiterte persönliche und familienbezogene Informationen anzugeben. Diese Daten werden ausschließlich dazu verwendet, Ihre Kita-Suche und die automatische Generierung von Bewerbungsschreiben durch unsere KI zu verbessern.",
    dataPoints: [
      "Berufliche Informationen (Berufsbezeichnung, Arbeitgeber, Arbeitsort)",
      "Arbeitszeitmodell und Betreuungsbedarfe",
      "Familiensituation (z.B. Alleinerziehend, geteiltes Sorgerecht)",
      "Zu Hause gesprochene Sprachen",
      "Gewünschter Betreuungsbeginn und Budget",
    ],
    purpose: [
      "Optimierung der Kita-Suchergebnisse nach Lage und Öffnungszeiten",
      "Personalisierung der KI-Kita-Empfehlungen",
      "Automatische Anpassung von Bewerbungsschreiben",
    ],
    legal:
      "Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Ihre Daten werden nicht an Dritte weitergegeben und ausschließlich auf Servern innerhalb der EU gespeichert (Supabase, Frankfurt). Sie können Ihre Einwilligung jederzeit widerrufen, indem Sie die Daten löschen oder Ihr Konto entfernen.",
  },
  ai_preferences: {
    title: "Datenschutz-Einwilligung",
    subtitle: "KI-gestützte Datenverarbeitung",
    intro:
      "Sie sind dabei, Präferenzen für die KI-gestützte Kita-Empfehlung anzugeben. Diese Daten werden an unser KI-System übermittelt, um personalisierte Empfehlungen zu generieren.",
    dataPoints: [
      "Pädagogische Präferenzen (z.B. Montessori, Waldorf)",
      "Bevorzugter Träger-Typ",
      "Gewünschte Sprachen und Bilingualität",
      "Betreuungszeiten-Präferenzen",
    ],
    purpose: [
      "Generierung personalisierter Kita-Empfehlungen durch KI",
      "Verbesserung der Suchrelevanz",
    ],
    legal:
      "Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Die Verarbeitung erfolgt durch unser selbst betriebenes KI-System (keine Weitergabe an OpenAI oder andere externe KI-Anbieter). Daten verbleiben innerhalb der EU.",
  },
};

export function DataPrivacyConsentDialog({
  onAccept,
  onDecline,
  context,
}: DataPrivacyConsentDialogProps) {
  const text = TEXTS[context];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[4000] bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
        className="fixed inset-0 z-[4001] flex items-center justify-center p-4"
      >
        <div className="relative w-full max-w-lg rounded-2xl bg-background shadow-2xl border border-border">
          {/* Header */}
          <div className="flex items-start gap-3 border-b border-border p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 id="consent-title" className="font-bold text-foreground">
                {text.title}
              </h2>
              <p className="text-sm text-muted-foreground">{text.subtitle}</p>
            </div>
            <button
              onClick={onDecline}
              className="ml-auto shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent"
              aria-label="Abbrechen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
            <p className="text-sm text-foreground leading-relaxed">{text.intro}</p>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Verarbeitete Datenkategorien
              </p>
              <ul className="space-y-1">
                {text.dataPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Verwendungszweck
              </p>
              <ul className="space-y-1">
                {text.purpose.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  {text.legal}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  <strong>Freiwilligkeit:</strong> Die Angabe dieser Daten ist vollständig freiwillig.
                  Ohne diese Daten können Sie KitaRadar weiterhin nutzen, jedoch ohne personalisierte KI-Empfehlungen.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-border p-5">
            <button
              onClick={onDecline}
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Ablehnen
            </button>
            <button
              onClick={onAccept}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Einwilligen & speichern
            </button>
          </div>

          <p className="px-5 pb-4 text-center text-xs text-muted-foreground">
            WAMOCON GmbH · Datenschutzbeauftragter: datenschutz@wamocon.com ·{" "}
            <Link href="/legal/privacy" className="text-primary hover:underline">
              Datenschutzerklärung
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
