"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher() {
  const pathname = usePathname();

  function getLocalizedPath(locale: string) {
    const segments = pathname.split("/");
    segments[1] = locale;
    return segments.join("/");
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      {routing.locales.map((locale, index) => (
        <span key={locale} className="flex items-center gap-1">
          {index > 0 && <span className="text-border">|</span>}
          <Link
            href={getLocalizedPath(locale)}
            className="text-muted hover:text-foreground transition-colors uppercase font-medium"
          >
            {locale}
          </Link>
        </span>
      ))}
    </div>
  );
}
