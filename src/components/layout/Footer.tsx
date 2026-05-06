import Link from "next/link";
import { useTranslations } from "next-intl";
import { KitaRadarLogo } from "@/components/ui/KitaRadarLogo";

export function Footer() {
  const t = useTranslations("footer");
  const tLegal = useTranslations("legal");
  const tNav = useTranslations("nav");

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
              <KitaRadarLogo className="h-6 w-6" />
              <span>KitaRadar</span>
            </Link>
            <p className="mt-3 text-sm text-muted">{t("tagline")}</p>
            <p className="mt-4 text-xs text-muted">
              WAMOCON GmbH<br />
              Mergenthalerallee 79-81<br />
              65760 Eschborn
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("product")}</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>
                <Link href="/search" className="hover:text-foreground transition-colors">
                  {tNav("search")}
                </Link>
              </li>
              <li>
                <Link href="/feed" className="hover:text-foreground transition-colors">
                  {tNav("feed")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  {tNav("pricing")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("company")}</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>
                <Link href="/auth/register" className="hover:text-foreground transition-colors">
                  {tNav("register")}
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-foreground transition-colors">
                  {tNav("login")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t("legal")}</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>
                <Link href="/legal/imprint" className="hover:text-foreground transition-colors">
                  {tLegal("imprint")}
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
                  {tLegal("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-foreground transition-colors">
                  {tLegal("terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted">
          © {currentYear} WAMOCON GmbH. {t("rights")}
        </div>
      </div>
    </footer>
  );
}
