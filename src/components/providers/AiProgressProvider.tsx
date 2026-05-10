"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { AiProgressToast } from "@/components/ui/AiProgressToast";

interface AiProgressState {
  visible: boolean;
  isComplete: boolean;
  label: string;
  completeLabel: string;
}

interface AiProgressContextValue {
  /** Show the global progress toast. Optionally pass an opaque expand payload (e.g. kita key). */
  showProgress: (label: string, completeLabel: string, expandKey?: string) => void;
  /** Mark the current task as complete (toast shows success state). */
  markComplete: () => void;
  /** Dismiss the toast entirely. */
  dismiss: () => void;
  /** Retrieve a cached AI-generated letter by kita key (name+address). */
  getLetterResult: (kitaKey: string) => string | null;
  /** Store a generated letter in the cache (persists across modal open/close). */
  storeLetterResult: (kitaKey: string, letter: string) => void;
  /**
   * Register a callback that is called when the user clicks "expand" on the toast.
   * Only one callback can be active at a time; the last caller wins.
   */
  registerExpand: (fn: (expandKey: string | null) => void) => void;
  /** Returns the expand key stored by the last showProgress call. */
  getExpandKey: () => string | null;
}

const AiProgressContext = createContext<AiProgressContextValue | null>(null);

export function useAiProgress(): AiProgressContextValue {
  const ctx = useContext(AiProgressContext);
  if (!ctx) throw new Error("useAiProgress must be used within AiProgressProvider");
  return ctx;
}

export function AiProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AiProgressState>({
    visible: false,
    isComplete: false,
    label: "",
    completeLabel: "",
  });

  // In-memory cache: persists for the lifetime of the browser session (layout stays mounted)
  const letterCacheRef = useRef<Map<string, string>>(new Map());
  // Opaque key passed by the caller so the expand handler can identify which task to reopen
  const expandKeyRef = useRef<string | null>(null);
  // Registered expand callback (set by SearchClient or any other consumer)
  const expandCallbackRef = useRef<((expandKey: string | null) => void) | null>(null);

  const showProgress = useCallback((label: string, completeLabel: string, expandKey?: string) => {
    setState({ visible: true, isComplete: false, label, completeLabel });
    expandKeyRef.current = expandKey ?? null;
  }, []);

  const markComplete = useCallback(() => {
    setState((prev) => ({ ...prev, isComplete: true }));
  }, []);

  const dismiss = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false, isComplete: false }));
  }, []);

  const getLetterResult = useCallback((kitaKey: string): string | null => {
    return letterCacheRef.current.get(kitaKey) ?? null;
  }, []);

  const storeLetterResult = useCallback((kitaKey: string, letter: string) => {
    letterCacheRef.current.set(kitaKey, letter);
  }, []);

  const registerExpand = useCallback((fn: (expandKey: string | null) => void) => {
    expandCallbackRef.current = fn;
  }, []);

  const getExpandKey = useCallback((): string | null => {
    return expandKeyRef.current;
  }, []);

  const handleExpand = useCallback(() => {
    expandCallbackRef.current?.(expandKeyRef.current);
  }, []);

  return (
    <AiProgressContext.Provider
      value={{ showProgress, markComplete, dismiss, getLetterResult, storeLetterResult, registerExpand, getExpandKey }}
    >
      {children}
      {/* Rendered at layout level — persists across page navigation and modal open/close */}
      <AiProgressToast
        visible={state.visible}
        isComplete={state.isComplete}
        label={state.label}
        completeLabel={state.completeLabel}
        onDismiss={dismiss}
        onExpand={handleExpand}
      />
    </AiProgressContext.Provider>
  );
}
