import { createClient } from "@/lib/supabase/server";
import { Users, CreditCard, Search, FileText } from "lucide-react";

async function getStats() {
  const supabase = await createClient();
  const [usersRes, proRes, searchesTodayRes, applicationsRes] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("tier", "pro"),
    supabase.from("profiles").select("search_count").gte("updated_at", new Date(Date.now() - 86400000).toISOString()),
    supabase.from("applications").select("id", { count: "exact", head: true }),
  ]);

  const totalSearchesToday = (searchesTodayRes.data ?? []).reduce(
    (sum, p: { search_count: number }) => sum + (p.search_count ?? 0),
    0
  );

  return {
    totalUsers: usersRes.count ?? 0,
    proUsers: proRes.count ?? 0,
    searchesToday: totalSearchesToday,
    totalApplications: applicationsRes.count ?? 0,
  };
}

export default async function AdminOverviewPage() {
  const stats = await getStats();

  const cards = [
    { label: "Registrierte Nutzer", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "Pro-Abonnenten", value: stats.proUsers, icon: CreditCard, color: "text-emerald-500" },
    { label: "Suchanfragen (24h)", value: stats.searchesToday, icon: Search, color: "text-purple-500" },
    { label: "Bewerbungen gesamt", value: stats.totalApplications, icon: FileText, color: "text-orange-500" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Admin-Übersicht</h1>
        <p className="text-sm text-muted-foreground">KitaRadar Plattform-Statistiken</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-3xl font-bold text-foreground">{value.toLocaleString("de-DE")}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Conversion Rate</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 rounded-full bg-accent h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-primary transition-all"
              style={{ width: stats.totalUsers > 0 ? `${Math.round((stats.proUsers / stats.totalUsers) * 100)}%` : "0%" }}
            />
          </div>
          <span className="text-sm font-medium text-foreground">
            {stats.totalUsers > 0
              ? `${Math.round((stats.proUsers / stats.totalUsers) * 100)} %`
              : "—"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {stats.proUsers} von {stats.totalUsers} Nutzern haben Pro
        </p>
      </div>
    </div>
  );
}
