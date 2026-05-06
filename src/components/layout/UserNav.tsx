import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Bell, User, LogOut } from "lucide-react";

export async function UserNav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const t = await getTranslations("nav");

  if (!user) {
    return (
      <div className="hidden items-center gap-2 sm:flex">
        <Link
          href="/auth/login"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          {t("login")}
        </Link>
        <Link
          href="/auth/register"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          {t("register")}
        </Link>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-1 sm:flex">
      <Link
        href="/notifications"
        className="rounded-md p-2 text-muted hover:bg-border hover:text-foreground transition-colors"
        aria-label={t("notifications" as never) ?? "Benachrichtigungen"}
      >
        <Bell className="h-4 w-4" />
      </Link>
      <Link
        href="/dashboard"
        className="rounded-md p-2 text-muted hover:bg-border hover:text-foreground transition-colors"
        aria-label={t("dashboard")}
      >
        <User className="h-4 w-4" />
      </Link>
      <form action="/api/auth/signout" method="POST">
        <button
          type="submit"
          className="rounded-md p-2 text-muted hover:bg-border hover:text-foreground transition-colors"
          aria-label={t("logout")}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
