import { useTranslations } from "next-intl";
import Link from "next/link";
import { KitaRadarLogo } from "@/components/ui/KitaRadarLogo";
import { ResetForm } from "./ResetForm";

export default function ResetPage() {
  const t = useTranslations("auth.reset");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-foreground">
            <KitaRadarLogo className="h-8 w-8" />
            <span className="text-xl">KitaRadar</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <ResetForm />
        <p className="mt-6 text-center text-sm">
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            {t("back_to_login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
