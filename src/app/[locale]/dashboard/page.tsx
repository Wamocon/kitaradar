import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import {
  LayoutDashboard,
  Search,
  FileText,
  MessageSquare,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Bell,
  Sparkles,
  MapPin,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Entwurf", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
  sent: { label: "Gesendet", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  response_received: { label: "Antwort erhalten", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  rejected: { label: "Abgelehnt", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  application: FileText,
  recommendation: Sparkles,
  search: Search,
  location: MapPin,
};

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [profileRes, applicationsRes, notificationsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, subscription_tier, search_count_month, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("applications")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("id, type, title, message, created_at, read")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const profile = profileRes.data;
  const applications = applicationsRes.data ?? [];
  const notifications = notificationsRes.data ?? [];

  const isPro = profile?.subscription_tier === "pro";
  const searchCount = profile?.search_count_month ?? 0;
  const remaining = Math.max(0, 10 - searchCount);
  const responsesCount = applications.filter((a) => a.status === "response_received").length;
  const sentCount = applications.filter((a) => a.status === "sent").length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
              {profile?.full_name && (
                <p className="mt-1 text-sm text-muted">Willkommen zurück, {profile.full_name}</p>
              )}
            </div>
            <Link
              href="/search"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <Search className="h-4 w-4" />
              Suche starten
            </Link>
          </div>

          {/* Upgrade Banner (Free Plan) */}
          {!isPro && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-500" />
              <div className="flex-1 text-sm">
                <span className="font-medium text-amber-800 dark:text-amber-300">
                  {t("upgrade_banner.title")}:
                </span>{" "}
                <span className="text-amber-700 dark:text-amber-400">
                  {t("upgrade_banner.desc", { remaining })}
                </span>
              </div>
              <Link
                href="/pricing"
                className="flex items-center gap-1 rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
              >
                {t("upgrade_banner.cta")} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Suchen (Monat)", value: String(searchCount), icon: Search, color: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-400" },
              { label: t("stats.applications"), value: String(applications.length), icon: FileText, color: "bg-violet-100 dark:bg-violet-900/30", iconColor: "text-violet-600 dark:text-violet-400" },
              { label: "Gesendet", value: String(sentCount), icon: TrendingUp, color: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400" },
              { label: t("stats.responses"), value: String(responsesCount), icon: MessageSquare, color: "bg-green-100 dark:bg-green-900/30", iconColor: "text-green-600 dark:text-green-400" },
            ].map(({ label, value, icon: Icon, color, iconColor }) => (
              <div key={label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Applications (3/5) */}
            <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">{t("applications.title")}</h2>
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              </div>

              {applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">{t("applications.empty")}</p>
                  <Link
                    href="/search"
                    className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                  >
                    Kitas suchen
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {applications.map((app) => {
                    const statusInfo = STATUS_LABELS[app.status] ?? STATUS_LABELS.draft;
                    const StatusIcon = app.status === "response_received" ? CheckCircle2 : Clock;
                    return (
                      <div key={app.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3">
                          <StatusIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{app.kita_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(app.created_at).toLocaleDateString("de-DE")}
                            </p>
                          </div>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Activity Feed (2/5) */}
            <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Aktivitäten</h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                    {unreadCount} neu
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-xs text-muted-foreground">Noch keine Aktivitäten</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => {
                    const Icon = NOTIFICATION_ICONS[n.type] ?? Bell;
                    return (
                      <div key={n.id} className={`flex gap-3 rounded-lg p-2.5 ${!n.read ? "bg-primary/5" : ""}`}>
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground leading-tight">{n.title}</p>
                          {n.message && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            {new Date(n.created_at).toLocaleDateString("de-DE")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <Link
                    href="/notifications"
                    className="block text-center text-xs text-primary hover:underline mt-2"
                  >
                    Alle anzeigen →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Pro actions */}
          {isPro && (
            <div className="mt-6 flex gap-3">
              <form action="/api/stripe/portal" method="POST">
                <button
                  type="submit"
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-border/40 transition-colors"
                >
                  Abo verwalten
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
