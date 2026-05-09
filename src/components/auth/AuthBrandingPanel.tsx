"use client";

import { KitaRadarLogo } from "@/components/ui/KitaRadarLogo";
import { useTranslations } from "next-intl";

const FEATURE_KEYS = [
  { emoji: "🗺️", key: "feature_map" },
  { emoji: "🤖", key: "feature_ai" },
  { emoji: "✉️", key: "feature_apply" },
  { emoji: "📊", key: "feature_track" },
] as const;

export function AuthBrandingPanel() {
  const t = useTranslations("auth.branding");

  return (
    <div
      className="hidden lg:flex flex-col justify-between p-10 w-[440px] shrink-0"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1a2e5a 50%, #2563eb 100%)",
      }}
    >
      {/* Logo + Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
          <KitaRadarLogo className="h-6 w-6" />
        </div>
        <div>
          <div className="text-white font-black text-lg">KitaRadar</div>
          <div className="text-white/40 text-[10px] uppercase tracking-widest">
            {t("tagline")}
          </div>
        </div>
      </div>

      {/* Main headline */}
      <div>
        <h2 className="text-3xl font-black text-white leading-tight mb-4">
          {t("headline_line1")}
          <br />
          {t("headline_line2")}
        </h2>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          {t("subline")}
        </p>

        {/* Feature list */}
        <div className="space-y-3">
          {FEATURE_KEYS.map((f) => (
            <div
              key={f.key}
              className="flex items-center gap-3 text-sm text-white/70 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"
            >
              <span className="text-base">{f.emoji}</span>
              <span>{t(f.key)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust line */}
      <p className="text-white/30 text-xs">
        {t("trust_line")}
      </p>
    </div>
  );
}
