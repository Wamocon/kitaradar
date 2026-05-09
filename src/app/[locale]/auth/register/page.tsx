import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { KitaRadarLogo } from "@/components/ui/KitaRadarLogo";
import { RegisterForm } from "./RegisterForm";
import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  return { title: `${t("title")} – KitaRadar` };
}

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");

  return (
    <main className="min-h-screen flex">
      {/* Left – Branding panel */}
      <AuthBrandingPanel />

      {/* Right – Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-zinc-50 dark:bg-zinc-950">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-foreground">
              <KitaRadarLogo className="h-8 w-8" />
              <span className="text-xl">KitaRadar</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("has_account")}{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              {t("login_link")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
