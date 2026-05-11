"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { OverpassKita } from "@/lib/overpass";

// ─── Cover Letter State ───────────────────────────────────────────────────────
interface LetterCtx {
  kita: OverpassKita | null;
  isOpen: boolean;        // full modal open
  openFor: (kita: OverpassKita) => void;
  minimize: () => void;   // full modal → toast
  dismiss: () => void;    // fully close + clear
}

// ─── KI Recommendation Toast State ───────────────────────────────────────────
interface RecoCtx {
  isVisible: boolean;
  isGenerating: boolean;
  isDone: boolean;
  show: () => void;
  setGenerating: (v: boolean) => void;
  finish: () => void;
  dismiss: () => void;
}

interface AiProgressCtx {
  letter: LetterCtx;
  reco: RecoCtx;
}

const Ctx = createContext<AiProgressCtx | null>(null);

export function AiProgressProvider({ children }: { children: ReactNode }) {
  // ── Letter ────────────────────────────────────────────────────────────────
  const [letterKita, setLetterKita] = useState<OverpassKita | null>(null);
  const [isLetterOpen, setIsLetterOpen] = useState(false);

  const openLetterFor = useCallback((kita: OverpassKita) => {
    setLetterKita(kita);
    setIsLetterOpen(true);
  }, []);

  const minimizeLetter = useCallback(() => setIsLetterOpen(false), []);

  const dismissLetter = useCallback(() => {
    setIsLetterOpen(false);
    setLetterKita(null);
  }, []);

  // ── Reco ──────────────────────────────────────────────────────────────────
  const [isRecoVisible, setIsRecoVisible] = useState(false);
  const [isRecoGenerating, setIsRecoGenerating] = useState(false);
  const [isRecoDone, setIsRecoDone] = useState(false);

  const showReco = useCallback(() => {
    setIsRecoVisible(true);
    setIsRecoDone(false);
    setIsRecoGenerating(true);
  }, []);

  const setRecoGenerating = useCallback((v: boolean) => setIsRecoGenerating(v), []);

  const finishReco = useCallback(() => {
    setIsRecoGenerating(false);
    setIsRecoDone(true);
  }, []);

  const dismissReco = useCallback(() => {
    setIsRecoVisible(false);
    setIsRecoGenerating(false);
    setIsRecoDone(false);
  }, []);

  return (
    <Ctx.Provider
      value={{
        letter: {
          kita:    letterKita,
          isOpen:  isLetterOpen,
          openFor: openLetterFor,
          minimize: minimizeLetter,
          dismiss: dismissLetter,
        },
        reco: {
          isVisible:    isRecoVisible,
          isGenerating: isRecoGenerating,
          isDone:       isRecoDone,
          show:         showReco,
          setGenerating: setRecoGenerating,
          finish:       finishReco,
          dismiss:      dismissReco,
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAiProgress(): AiProgressCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAiProgress must be used inside AiProgressProvider");
  return ctx;
}
