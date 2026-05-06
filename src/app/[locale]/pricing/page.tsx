import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, X } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing");
  return { title: t("headline") };
}

export default function PricingPage() {
  const t = useTranslations("pricing");

  const freeFeatures = [0, 1, 2, 3] as const;
  const proFeatures = [0, 1, 2, 3, 4, 5, 6] as const;

  const comparison = [
    { feature: "Umkreissuche", free: true, pro: true },
    { feature: "10 Suchanfragen / Monat", free: true, pro: false },
    { feature: "Unbegrenzte Suchanfragen", free: false, pro: true },
    { feature: "KI-Suchassistent", free: false, pro: true },
    { feature: "KI-Bewerbungsgenerator", free: false, pro: true },
    { feature: "E-Mail-Direktversand", free: false, pro: true },
    { feature: "Bewerbungs-Tracking", free: false, pro: true },
    { feature: "Community-Feed lesen", free: true, pro: true },
    { feature: "Community-Beiträge verfassen", free: false, pro: true },
    { feature: "Prioritäts-Support", free: false, pro: true },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground">{t("headline")}</h1>
            <p className="mt-3 text-muted">{t("subline")}</p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border border-border bg-card p-8">
              <p className="text-xl font-bold text-foreground">{t("free.name")}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">{t("free.price")}</span>
                <span className="text-muted">{t("free.period")}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {freeFeatures.map((i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-muted">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                    {t(`free.features.${i}` as never)}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="mt-8 block rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold text-foreground hover:bg-background transition-colors"
              >
                {t("free.cta")}
              </Link>
              <p className="mt-2 text-center text-xs text-muted">{t("free.note")}</p>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-primary bg-card p-8 shadow-lg">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-primary px-4 py-1 text-xs font-bold text-white shadow">
                  {t("pro.badge")}
                </span>
              </div>
              <p className="text-xl font-bold text-foreground">{t("pro.name")}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">{t("pro.price")}</span>
                <span className="text-muted">{t("pro.period")}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {proFeatures.map((i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-muted">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />
                    {t(`pro.features.${i}` as never)}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="mt-8 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-white hover:bg-primary-hover transition-colors"
              >
                {t("pro.cta")}
              </Link>
              <p className="mt-2 text-center text-xs text-muted">{t("pro.note")}</p>
            </div>
          </div>

          {/* Feature comparison */}
          <div className="mt-16 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Feature</th>
                  <th className="px-6 py-4 text-center font-semibold text-foreground">Free</th>
                  <th className="px-6 py-4 text-center font-semibold text-primary">Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(({ feature, free, pro }, i) => (
                  <tr key={feature} className={`border-b border-border ${i % 2 === 0 ? "bg-background" : "bg-card"}`}>
                    <td className="px-6 py-3 text-foreground">{feature}</td>
                    <td className="px-6 py-3 text-center">
                      {free ? (
                        <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-muted/40" />
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {pro ? (
                        <CheckCircle className="mx-auto h-4 w-4 text-primary" />
                      ) : (
                        <X className="mx-auto h-4 w-4 text-muted/40" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
