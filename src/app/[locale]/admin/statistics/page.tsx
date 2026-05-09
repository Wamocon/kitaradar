import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Database,
  Users,
  FileText,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Activity,
} from "lucide-react";
import { AdminRefreshButtons } from "@/components/admin/AdminRefreshButtons";

export const dynamic = "force-dynamic";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  accent?: "blue" | "green" | "amber" | "red" | "violet";
}

function StatCard({ label, value, sub, icon: Icon, accent = "blue" }: StatCardProps) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    green: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    red: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2 ${colors[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

export default async function AdminStatisticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const now = new Date();
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Parallel data fetching
  const [
    { count: totalEnrichments },
    { count: freshEnrichments },
    { count: staleEnrichments },
    { count: totalReviews },
    { count: totalUsers },
    { count: proUsers },
    { count: newUsersThisMonth },
    { count: usersWithConsent },
    { count: totalApplications },
    { count: sentApplications },
    { count: totalPosts },
    { count: totalNotifications },
    lastEnrichedRes,
  ] = await Promise.all([
    supabase.from("kita_enrichments").select("*", { count: "exact", head: true }),
    supabase
      .from("kita_enrichments")
      .select("*", { count: "exact", head: true })
      .gte("enriched_at", seventyTwoHoursAgo),
    supabase
      .from("kita_enrichments")
      .select("*", { count: "exact", head: true })
      .lt("enriched_at", seventyTwoHoursAgo),
    supabase.from("kita_reviews").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("subscription_tier", "pro"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("ai_consent", true),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "sent"),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("notifications").select("*", { count: "exact", head: true }),
    supabase
      .from("kita_enrichments")
      .select("enriched_at")
      .order("enriched_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const lastEnrichedAt = lastEnrichedRes.data?.enriched_at
    ? new Date(lastEnrichedRes.data.enriched_at).toLocaleString("de-DE")
    : "—";

  const freshPct =
    totalEnrichments && totalEnrichments > 0
      ? Math.round(((freshEnrichments ?? 0) / totalEnrichments) * 100)
      : 0;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Statistiken & Datenquellen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Echtzeit-Überblick über Datenquellen, Cache-Zustand und Nutzerstatistiken
        </p>
      </div>

      {/* ── DATENQUELLEN ── */}
      <section className="mb-8">
        <SectionTitle>
          <Database className="h-4 w-4" />
          Datenquellen
        </SectionTitle>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-accent/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Quelle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Datensätze</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Aktualisierung</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Letzte Aktualisierung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-accent/20">
                <td className="px-4 py-3 font-medium text-foreground">OpenStreetMap (Overpass)</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" /> Live
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">On-demand (Overpass API)</td>
                <td className="px-4 py-3 text-muted-foreground">Jede Suche</td>
                <td className="px-4 py-3 text-muted-foreground">Echtzeit</td>
              </tr>
              <tr className="hover:bg-accent/20">
                <td className="px-4 py-3 font-medium text-foreground">Google Places</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <Clock className="h-3 w-3" /> Cache
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{totalEnrichments ?? 0} Kitas angereichert</td>
                <td className="px-4 py-3 text-muted-foreground">72h Cache</td>
                <td className="px-4 py-3 text-muted-foreground">{lastEnrichedAt}</td>
              </tr>
              <tr className="hover:bg-accent/20">
                <td className="px-4 py-3 font-medium text-foreground">Wikidata</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <Clock className="h-3 w-3" /> Cache
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{totalEnrichments ?? 0} Einträge</td>
                <td className="px-4 py-3 text-muted-foreground">72h Cache (mit Google Places)</td>
                <td className="px-4 py-3 text-muted-foreground">{lastEnrichedAt}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── ENRICHMENT CACHE ── */}
      <section className="mb-8">
        <SectionTitle>
          <Activity className="h-4 w-4" />
          Enrichment-Cache
        </SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Kitas angereichert"
            value={totalEnrichments ?? 0}
            sub="Gesamt im Cache"
            icon={Database}
            accent="blue"
          />
          <StatCard
            label="Frisch (< 72h)"
            value={freshEnrichments ?? 0}
            sub={`${freshPct}% des Cache`}
            icon={CheckCircle2}
            accent="green"
          />
          <StatCard
            label="Veraltet (> 72h)"
            value={staleEnrichments ?? 0}
            sub="Werden on-demand erneuert"
            icon={AlertCircle}
            accent="amber"
          />
          <StatCard
            label="Community-Bewertungen"
            value={totalReviews ?? 0}
            sub="Von Eltern eingereicht"
            icon={FileText}
            accent="violet"
          />
        </div>
      </section>

      {/* ── NUTZERSTATISTIKEN ── */}
      <section className="mb-8">
        <SectionTitle>
          <Users className="h-4 w-4" />
          Nutzerstatistiken
        </SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Nutzer gesamt"
            value={totalUsers ?? 0}
            icon={Users}
            accent="blue"
          />
          <StatCard
            label="Pro-Nutzer"
            value={proUsers ?? 0}
            sub={totalUsers ? `${Math.round(((proUsers ?? 0) / totalUsers) * 100)}% Conversion` : "—"}
            icon={BarChart2}
            accent="violet"
          />
          <StatCard
            label="Neu diesen Monat"
            value={newUsersThisMonth ?? 0}
            icon={Users}
            accent="green"
          />
          <StatCard
            label="KI-Einwilligung erteilt"
            value={usersWithConsent ?? 0}
            sub={totalUsers ? `${Math.round(((usersWithConsent ?? 0) / totalUsers) * 100)}% der Nutzer` : "—"}
            icon={CheckCircle2}
            accent="green"
          />
        </div>
      </section>

      {/* ── BEWERBUNGEN & FEED ── */}
      <section className="mb-8">
        <SectionTitle>
          <FileText className="h-4 w-4" />
          Bewerbungen & Community
        </SectionTitle>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Bewerbungen gesamt"
            value={totalApplications ?? 0}
            icon={FileText}
            accent="blue"
          />
          <StatCard
            label="Gesendet"
            value={sentApplications ?? 0}
            sub={totalApplications ? `${Math.round(((sentApplications ?? 0) / (totalApplications ?? 1)) * 100)}% abgeschlossen` : "—"}
            icon={CheckCircle2}
            accent="green"
          />
          <StatCard
            label="Feed-Beiträge"
            value={totalPosts ?? 0}
            icon={Activity}
            accent="violet"
          />
          <StatCard
            label="Benachrichtigungen"
            value={totalNotifications ?? 0}
            icon={Activity}
            accent="amber"
          />
        </div>
      </section>

      {/* ── AUTOMATISIERUNG ── */}
      <section>
        <SectionTitle>
          <RefreshCw className="h-4 w-4" />
          Automatisierung & Cache-Verwaltung
        </SectionTitle>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-sm text-muted-foreground">
            Manuelle Aktionen zur Datenverwaltung. Cache-Einträge werden automatisch bei Bedarf erneuert (72h TTL).
          </p>
          <AdminRefreshButtons staleCount={staleEnrichments ?? 0} />
        </div>
      </section>
    </div>
  );
}
