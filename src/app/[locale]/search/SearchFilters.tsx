"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

export function SearchFilters() {
  const t = useTranslations("search");
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState("5km");

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 min-w-48">
        <Search className="h-4 w-4 flex-shrink-0 text-muted" />
        <input
          type="text"
          placeholder={t("placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
      </div>
      <select
        value={radius}
        onChange={(e) => setRadius(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
      >
        {(["1km", "2km", "5km", "10km"] as const).map((r) => (
          <option key={r} value={r}>
            {t(`radius_options.${r}`)}
          </option>
        ))}
      </select>
      <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
        <option value="">{t("filters.type_all")}</option>
        <option value="public">{t("filters.type_public")}</option>
        <option value="church">{t("filters.type_church")}</option>
        <option value="private">{t("filters.type_private")}</option>
      </select>
      <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors">
        {t("ai_search_btn")}
      </button>
    </div>
  );
}
