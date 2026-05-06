import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { Bell, CheckCheck } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notifications");
  return { title: t("title") };
}

interface DBNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const t = await getTranslations("notifications");
  const items: DBNotification[] = notifications ?? [];
  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
              <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
            </div>
            {unreadCount > 0 && (
              <form action="/api/notifications" method="PATCH">
                <input type="hidden" name="all" value="true" />
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-border/40 transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                  {t("mark_all_read")}
                </button>
              </form>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted">
              <Bell className="h-12 w-12 opacity-20" />
              <p className="text-sm">{t("empty")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    n.is_read
                      ? "border-border bg-card"
                      : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    {!n.is_read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1" />
                    )}
                  </div>
                  {n.body && (
                    <p className="mt-1 text-sm text-muted">{n.body}</p>
                  )}
                  <p className="mt-2 text-xs text-muted/60">
                    {new Date(n.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
