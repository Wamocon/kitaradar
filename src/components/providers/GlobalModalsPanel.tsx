"use client";

/**
 * GlobalModalsPanel — rendered once in the root layout.
 * Shows persistent bottom-right toasts for:
 *   1. Cover letter generation (Anschreiben)
 *   2. KI recommendations (KI-Empfehlung)
 * Both toasts survive page navigation. Clicking a toast re-opens the full modal.
 */

import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, ChevronDown, ChevronUp, X, Sparkles, FileText } from "lucide-react";
import { useAiProgress } from "./AiProgressProvider";
import { ApplicationModal } from "@/components/search/ApplicationModal";

// ─── Mini toast card ─────────────────────────────────────────────────────────
function ToastCard({
  icon,
  label,
  completeLabel,
  isGenerating,
  isDone,
  minimized,
  onToggleMinimize,
  onDismiss,
  onClick,
  elapsed,
}: {
  icon: React.ReactNode;
  label: string;
  completeLabel: string;
  isGenerating: boolean;
  isDone: boolean;
  minimized: boolean;
  onToggleMinimize: () => void;
  onDismiss: () => void;
  onClick?: () => void;
  elapsed: number;
}) {
  const progressPct = Math.min((elapsed / 90) * 100, 95);
  const statusText =
    elapsed < 5
      ? "Starte KI-Analyse…"
      : elapsed < 30
        ? `Verarbeitung – ${elapsed}s`
        : `Komplexe Anfrage – ${elapsed}s`;

  return (
    <div
      className="w-72 rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-center justify-between gap-3 px-4 ${minimized ? "py-3" : "pt-4 pb-2"} ${onClick ? "cursor-pointer" : ""}`}
        onClick={onClick}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {isDone ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
          ) : isGenerating ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          ) : (
            <span className="shrink-0 text-primary">{icon}</span>
          )}
          <span className="truncate text-sm font-medium text-foreground">
            {isDone ? completeLabel : label}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {!isDone && (
            <button
              onClick={onToggleMinimize}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label={minimized ? "Maximieren" : "Minimieren"}
            >
              {minimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Schließen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!minimized && !isDone && isGenerating && (
        <div className="px-4 pb-4">
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{statusText}</p>
        </div>
      )}

      {!minimized && isDone && (
        <div className="px-4 pb-3">
          <p className="text-xs text-green-600 dark:text-green-400">Fertig – zum Öffnen klicken.</p>
        </div>
      )}

      {!minimized && !isDone && !isGenerating && onClick && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground">Klicken zum Öffnen.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main panel ─────────────────────────────────────────────────────────────
export function GlobalModalsPanel() {
  const { letter, reco } = useAiProgress();

  // Per-toast minimized states
  const [letterMin, setLetterMin] = useState(false);
  const [recoMin, setRecoMin]     = useState(false);

  // Elapsed timers — tracked via start-time refs to avoid sync setState in effects
  const [letterElapsed, setLetterElapsed] = useState(0);
  const [recoElapsed, setRecoElapsed]     = useState(0);
  const letterTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const recoTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const letterStartRef  = useRef(0);
  const recoStartRef    = useRef(0);

  // Track prev letter.kita id to detect new session and re-expand toast
  const prevLetterIdRef = useRef<string | null>(null);

  // Letter timer
  useEffect(() => {
    const newId = letter.kita?.id ?? null;
    if (newId && newId !== prevLetterIdRef.current) {
      prevLetterIdRef.current = newId;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLetterMin(false);
    } else if (!newId) {
      prevLetterIdRef.current = null;
    }

    if (letter.kita) {
      letterStartRef.current = Date.now();
      letterTimerRef.current = setInterval(
        () => setLetterElapsed(Math.floor((Date.now() - letterStartRef.current) / 1000)),
        1000,
      );
    } else {
      if (letterTimerRef.current) clearInterval(letterTimerRef.current);
    }
    return () => { if (letterTimerRef.current) clearInterval(letterTimerRef.current); };
  }, [letter.kita]);

  // Reco timer
  useEffect(() => {
    if (reco.isGenerating) {
      recoStartRef.current = Date.now();
      recoTimerRef.current = setInterval(
        () => setRecoElapsed(Math.floor((Date.now() - recoStartRef.current) / 1000)),
        1000,
      );
    } else {
      if (recoTimerRef.current) clearInterval(recoTimerRef.current);
    }
    return () => { if (recoTimerRef.current) clearInterval(recoTimerRef.current); };
  }, [reco.isGenerating]);

  // Auto-dismiss reco toast 5s after done
  useEffect(() => {
    if (!reco.isDone) return;
    const id = setTimeout(() => reco.dismiss(), 5000);
    return () => clearTimeout(id);
  }, [reco.isDone, reco]);

  const showLetterToast = !!letter.kita && !letter.isOpen;
  const showRecoToast   = reco.isVisible;

  return (
    <>
      {/* ── Global ApplicationModal (rendered in layout, survives navigation) ── */}
      {letter.kita && letter.isOpen && (
        <ApplicationModal
          kita={letter.kita}
          onClose={letter.minimize}
        />
      )}

      {/* ── Bottom-right toast stack ── */}
      {(showLetterToast || showRecoToast) && (
        <div className="fixed bottom-6 right-6 z-[3000] flex flex-col gap-2 items-end">
          {/* Anschreiben toast */}
          {showLetterToast && (
            <ToastCard
              icon={<FileText className="h-4 w-4" />}
              label={`Anschreiben – ${letter.kita!.name}`}
              completeLabel={`Anschreiben – ${letter.kita!.name}`}
              isGenerating={false}
              isDone={false}
              minimized={letterMin}
              onToggleMinimize={() => setLetterMin((m) => !m)}
              onDismiss={letter.dismiss}
              onClick={letter.minimize /* minimize=false → will open */}
              elapsed={letterElapsed}
            />
          )}

          {/* KI-Empfehlung toast */}
          {showRecoToast && (
            <ToastCard
              icon={<Sparkles className="h-4 w-4" />}
              label="KI-Empfehlungen werden generiert…"
              completeLabel="KI-Empfehlungen fertig!"
              isGenerating={reco.isGenerating}
              isDone={reco.isDone}
              minimized={recoMin}
              onToggleMinimize={() => setRecoMin((m) => !m)}
              onDismiss={reco.dismiss}
              elapsed={recoElapsed}
            />
          )}
        </div>
      )}
    </>
  );
}
