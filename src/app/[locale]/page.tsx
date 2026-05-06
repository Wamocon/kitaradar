import { useTranslations } from "next-intl";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  MapPin,
  Sparkles,
  FileText,
  Users,
  BarChart3,
  Gift,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  const t = useTranslations("home");
  const tPricing = useTranslations("pricing");

  const features = [
    { key: "map", icon: MapPin },
    { key: "ai_search", icon: Sparkles },
    { key: "ai_apply", icon: FileText },
    { key: "community", icon: Users },
    { key: "tracking", icon: BarChart3 },
    { key: "free", icon: Gift },
  ] as const;

  const steps = ["step1", "step2", "step3", "step4"] as const;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white px-4 pt-20 pb-24 sm:px-6 dark:from-blue-950/20 dark:to-background">
          <div className="mx-auto max-w-4xl text-center">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              <Sparkles className="h-3 w-3" />
              {t("hero.badge")}
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("hero.headline")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {t("hero.subline")}
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/auth/register"
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
              >
                {t("hero.cta_primary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-card transition-colors"
              >
                {t("hero.cta_secondary")}
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-card py-10">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 sm:grid-cols-3 sm:px-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">306.000+</p>
              <p className="mt-1 text-sm text-muted">{t("stats.missing_spots")}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">6–12</p>
              <p className="mt-1 text-sm text-muted">{t("stats.avg_search_time")}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">&gt; 50 %</p>
              <p className="mt-1 text-sm text-muted">{t("stats.parents_frustrated")}</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground">{t("features.headline")}</h2>
              <p className="mt-3 text-muted">{t("features.subline")}</p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ key, icon: Icon }) => (
                <div
                  key={key}
                  className="rounded-xl border border-border bg-card p-6 hover:border-primary/40 transition-colors"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">
                    {t(`features.${key}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-card py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-3xl font-bold text-foreground">
              {t("how_it_works.headline")}
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {t(`how_it_works.${step}.title`)}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    {t(`how_it_works.${step}.desc`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="py-20 px-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-3xl font-bold text-foreground">{tPricing("headline")}</h2>
            <p className="mt-3 text-center text-muted">{tPricing("subline")}</p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {/* Free */}
              <div className="rounded-xl border border-border bg-card p-8">
                <p className="text-lg font-bold text-foreground">{tPricing("free.name")}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {tPricing("free.price")}
                  <span className="text-base font-normal text-muted">{tPricing("free.period")}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {(["Basis-Umkreissuche", "10 Suchanfragen/Monat", "Kita-Detailansicht", "Community-Feed lesen"] as const).map(
                    (_, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{tPricing(`free.features.${i}` as never)}</span>
                      </li>
                    )
                  )}
                </ul>
                <Link
                  href="/auth/register"
                  className="mt-8 block rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground hover:bg-background transition-colors"
                >
                  {tPricing("free.cta")}
                </Link>
                <p className="mt-2 text-center text-xs text-muted">{tPricing("free.note")}</p>
              </div>

              {/* Pro */}
              <div className="relative rounded-xl border-2 border-primary bg-card p-8 shadow-sm">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                  {tPricing("pro.badge")}
                </span>
                <p className="text-lg font-bold text-foreground">{tPricing("pro.name")}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {tPricing("pro.price")}
                  <span className="text-base font-normal text-muted">{tPricing("pro.period")}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {([0, 1, 2, 3, 4, 5, 6] as const).map((i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted">
                      <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{tPricing(`pro.features.${i}` as never)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className="mt-8 block rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-hover transition-colors"
                >
                  {tPricing("pro.cta")}
                </Link>
                <p className="mt-2 text-center text-xs text-muted">{tPricing("pro.note")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="bg-primary py-16 px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white">{t("cta_section.headline")}</h2>
            <p className="mt-3 text-blue-100">{t("cta_section.subline")}</p>
            <Link
              href="/auth/register"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-blue-50 transition-colors"
            >
              {t("cta_section.btn")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
