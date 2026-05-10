"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, ChevronDown, ChevronUp, X } from "lucide-react";

interface AiProgressToastProps {
  visible: boolean;
  isComplete: boolean;
  label: string;
  completeLabel: string;
  onDismiss: () => void;
  /** Optional: called when the user clicks the toast body to expand / reopen the source dialog. */
  onExpand?: () => void;
}

/**
 * Floating, collapsible progress indicator for long-running AI generations.
 * Renders in the bottom-right corner. User can minimise it while the generation
 * runs. Auto-dismisses 4 s after completion.
 */
export function AiProgressToast({
  visible,
  isComplete,
  label,
  completeLabel,
  onDismiss,
  onExpand,
}: AiProgressToastProps) {
  const [minimized, setMinimized] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(0);
  // Track previous visible+isComplete to detect new generation start
  const prevStateRef = useRef({ visible: false, isComplete: false });

  useEffect(() => {
    if (!visible || isComplete) return;
    // New generation started — re-expand the toast
    if (!prevStateRef.current.visible || prevStateRef.current.isComplete) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMinimized(() => false);
    }
    prevStateRef.current = { visible, isComplete };
    startTimeRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      clearInterval(id);
      setElapsed(0);
    };
  }, [visible, isComplete]);

  useEffect(() => {
    if (!isComplete) return;
    const id = setTimeout(onDismiss, 4000);
    return () => clearTimeout(id);
  }, [isComplete, onDismiss]);

  if (!visible) return null;

  const progressPct = Math.min((elapsed / 90) * 100, 95);
  const statusText =
    elapsed < 5
      ? "Starte KI-Analyse..."
      : elapsed < 30
        ? `Verarbeitung läuft \u2013 ${elapsed}s`
        : `Komplexe Anfrage \u2013 ${elapsed}s \u2013 noch einen Moment`;

  // The label row is clickable when onExpand is provided (reopens source modal)
  const LabelRow = (
    <div className="flex min-w-0 items-center gap-2.5">
      {isComplete ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
      ) : (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
      )}
      <span className="truncate text-sm font-medium text-foreground">
        {isComplete ? completeLabel : label}
      </span>
      {onExpand && !isComplete && (
        <span className="ml-auto shrink-0 text-xs text-primary underline-offset-2 hover:underline">
          Öffnen
        </span>
      )}
    </div>
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[3000] w-72 rounded-xl border border-border bg-card shadow-2xl"
    >
      <div
        className={`flex items-center justify-between gap-3 px-4 ${minimized ? "py-3" : "pt-4 pb-2"}`}
      >
        {onExpand && !isComplete ? (
          <button
            onClick={onExpand}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            aria-label="Fenster öffnen"
          >
            {LabelRow}
          </button>
        ) : (
          LabelRow
        )}
        <div className="flex shrink-0 items-center gap-1">
          {!isComplete && (
            <button
              onClick={() => setMinimized((m) => !m)}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label={minimized ? "Maximieren" : "Minimieren"}
            >
              {minimized ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          <button
            onClick={onDismiss}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Schliessen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {!minimized && (
        <div className="px-4 pb-4">
          {isComplete ? (
            <p className="text-xs text-green-600 dark:text-green-400">
              Die KI-Antwort ist bereit.
            </p>
          ) : (
            <>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-1000"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{statusText}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
