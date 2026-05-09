import Link from "next/link";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { KitaRadarLogo } from "@/components/ui/KitaRadarLogo";
import { NavLinks } from "./NavLinks";
import { UserNav } from "./UserNav";

export function Header() {
  const t = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
          <KitaRadarLogo className="h-7 w-7" />
          <span>KitaRadar</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/search" className="text-muted-foreground hover:text-foreground transition-colors">
            {t("search")}
          </Link>
          <Link href="/feed" className="text-muted-foreground hover:text-foreground transition-colors">
            {t("feed")}
          </Link>
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
            {t("dashboard")}
          </Link>
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            {t("pricing")}
          </Link>
          <Link href="/recommendations" className="flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">
            ✨ {t("recommendations")}
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserNav />
          <NavLinks />
        </div>
      </div>
    </header>
  );
}
