"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";

export function NavLinks() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-md p-2 text-muted hover:text-foreground"
        aria-label="Menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-14 border-b border-border bg-background p-4 shadow-lg">
          <nav className="flex flex-col gap-4 text-sm font-medium">
            <Link href="/search" onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
              {t("search")}
            </Link>
            <Link href="/feed" onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
              {t("feed")}
            </Link>
            <Link href="/pricing" onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
              {t("pricing")}
            </Link>
            <Link href="/auth/login" onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
              {t("login")}
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setOpen(false)}
              className="rounded-md bg-primary px-3 py-2 text-center text-white hover:bg-primary-hover"
            >
              {t("register")}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
