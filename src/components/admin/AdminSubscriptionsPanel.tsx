"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, RefreshCw, UserCheck, UserX, Calendar } from "lucide-react";

interface SubRow {
  id: string;
  profile_id: string;
  email: string;
  full_name: string | null;
  tier: string;
  stripe_customer_id: string | null;
  search_count: number;
  created_at: string;
}

const TIER_COLORS: Record<string, string> = {
  pro: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  free: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function AdminSubscriptionsPanel() {
  const [users, setUsers] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | "pro" | "free">("all");
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, tier, stripe_customer_id, search_count, created_at")
        .order("tier", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUsers((data ?? []).map((u: Record<string, unknown>) => ({ ...u, profile_id: u.id as string } as SubRow)));
    } catch {
      setMessage({ type: "error", text: "Fehler beim Laden." });
    } finally {
      setLoading(false);
    }
  }

  async function updateTier(userId: string, newTier: "pro" | "free") {
    setSaving(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: newTier }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, tier: newTier } : u));
      setMessage({ type: "success", text: `Abo auf ${newTier === "pro" ? "Pro" : "Free"} gesetzt.` });
    } catch {
      setMessage({ type: "error", text: "Fehler beim Aktualisieren." });
    } finally {
      setSaving(null);
    }
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search ||
        (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u.full_name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchTier = tierFilter === "all" || u.tier === tierFilter;
      return matchSearch && matchTier;
    });
  }, [users, search, tierFilter]);

  const proCount = users.filter((u) => u.tier === "pro").length;
  const freeCount = users.filter((u) => u.tier === "free").length;

  return (
    <div className="space-y-4">
      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          message.type === "success"
            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        }`}>
          {message.text}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Gesamt</p>
          <p className="text-2xl font-bold text-foreground">{users.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-4">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Pro</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{proCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Free</p>
          <p className="text-2xl font-bold text-foreground">{freeCount}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-48 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Nach Nutzer suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex rounded-lg border border-border bg-card overflow-hidden text-sm">
          {(["all", "pro", "free"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-2 transition-colors ${
                tierFilter === t
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "all" ? "Alle" : t === "pro" ? "Pro" : "Free"}
            </button>
          ))}
        </div>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/50 text-xs text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Nutzer</th>
              <th className="px-4 py-3 text-left font-medium">Abo-Status</th>
              <th className="px-4 py-3 text-left font-medium">Stripe-ID</th>
              <th className="px-4 py-3 text-left font-medium">Suchanfragen</th>
              <th className="px-4 py-3 text-left font-medium">Registriert</th>
              <th className="px-4 py-3 text-left font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Lade…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Keine Einträge gefunden.</td></tr>
            )}
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{user.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TIER_COLORS[user.tier] ?? TIER_COLORS.free}`}>
                    {user.tier === "pro" ? "Pro" : "Free"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.stripe_customer_id ? (
                    <code className="rounded bg-accent px-1.5 py-0.5 text-xs font-mono text-foreground">
                      {user.stripe_customer_id.slice(0, 18)}…
                    </code>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-foreground">{user.search_count}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(user.created_at).toLocaleDateString("de-DE")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => updateTier(user.id, user.tier === "pro" ? "free" : "pro")}
                    disabled={saving === user.id}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-50 transition-colors ${
                      user.tier === "pro"
                        ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                    }`}
                  >
                    {user.tier === "pro"
                      ? <><UserX className="h-3 w-3" /> Deaktivieren</>
                      : <><UserCheck className="h-3 w-3" /> Pro aktivieren</>
                    }
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
