"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, RefreshCw, Shield, User, UserCheck, UserX, ChevronDown } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  subscription_tier: string;
  search_count_month: number;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  mother: "Mutter",
  father: "Vater",
  parent: "Elternteil",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  mother: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  father: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  parent: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const TIER_COLORS: Record<string, string> = {
  pro: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  free: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function AdminUsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role, subscription_tier, search_count_month, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data ?? []);
    } catch {
      setMessage({ type: "error", text: "Fehler beim Laden der Nutzer." });
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(userId: string, newRole: string) {
    setSaving(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Update fehlgeschlagen");
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      setMessage({ type: "success", text: "Rolle aktualisiert." });
    } catch {
      setMessage({ type: "error", text: "Fehler beim Aktualisieren der Rolle." });
    } finally {
      setSaving(null);
    }
  }

  async function updateTier(userId: string, newTier: string) {
    setSaving(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_tier: newTier }),
      });
      if (!res.ok) throw new Error("Update fehlgeschlagen");
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, subscription_tier: newTier } : u));
      setMessage({ type: "success", text: "Abo-Status aktualisiert." });
    } catch {
      setMessage({ type: "error", text: "Fehler beim Aktualisieren des Abo-Status." });
    } finally {
      setSaving(null);
    }
  }

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search ||
        (u.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u.full_name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-48 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Nach Name oder E-Mail suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none"
        >
          <option value="all">Alle Rollen</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button
          onClick={loadUsers}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </button>
        <span className="text-xs text-muted-foreground">{filtered.length} Nutzer</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/50 text-xs text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Nutzer</th>
              <th className="px-4 py-3 text-left font-medium">Rolle</th>
              <th className="px-4 py-3 text-left font-medium">Abo</th>
              <th className="px-4 py-3 text-left font-medium">Suchanfragen</th>
              <th className="px-4 py-3 text-left font-medium">Registriert</th>
              <th className="px-4 py-3 text-left font-medium">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Lade Nutzer…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Keine Nutzer gefunden.
                </td>
              </tr>
            )}
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {(user.full_name ?? user.email ?? "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.full_name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] ?? ROLE_COLORS.parent}`}>
                    {user.role === "admin" ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {ROLE_LABELS[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TIER_COLORS[user.subscription_tier] ?? TIER_COLORS.free}`}>
                    {user.subscription_tier === "pro" ? "Pro" : "Free"}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground">{user.search_count_month}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(user.created_at).toLocaleDateString("de-DE")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* Rolle ändern */}
                    <div className="relative">
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        disabled={saving === user.id}
                        className="appearance-none rounded-md border border-border bg-background pl-2 pr-6 py-1 text-xs text-foreground focus:outline-none disabled:opacity-50"
                      >
                        {Object.entries(ROLE_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    </div>
                    {/* Abo ändern */}
                    <button
                      onClick={() => updateTier(user.id, user.subscription_tier === "pro" ? "free" : "pro")}
                      disabled={saving === user.id}
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50 transition-colors ${
                        user.subscription_tier === "pro"
                          ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
                      }`}
                    >
                      {user.subscription_tier === "pro" ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                      {user.subscription_tier === "pro" ? "Free" : "Pro"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
