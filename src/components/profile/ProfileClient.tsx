"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Plus, Trash2, Download, AlertTriangle, Bell, BellOff, MapPin, Shield, User } from "lucide-react";

interface Child {
  id: string;
  name: string;
  birth_month: number | null;
  birth_year: number | null;
  special_needs: string | null;
}

interface ProfileClientProps {
  initialName: string;
  initialChildren: Child[];
  tier: string;
  searchCount: number;
  role?: string;
  phone?: string | null;
  partnerName?: string | null;
  notificationEmail?: boolean;
  defaultSearchCity?: string | null;
  defaultSearchRadius?: number;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  mother: "Mutter",
  father: "Vater",
  parent: "Elternteil",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield className="h-3 w-3" />,
  mother: <User className="h-3 w-3" />,
  father: <User className="h-3 w-3" />,
  parent: <User className="h-3 w-3" />,
};

export function ProfileClient({
  initialName,
  initialChildren,
  tier,
  searchCount,
  role: initialRole = "parent",
  phone: initialPhone = "",
  partnerName: initialPartnerName = "",
  notificationEmail: initialNotificationEmail = true,
  defaultSearchCity: initialDefaultSearchCity = "",
  defaultSearchRadius: initialDefaultSearchRadius = 5,
}: ProfileClientProps) {
  const [fullName, setFullName] = useState(initialName);
  const [role, setRole] = useState(initialRole);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [partnerName, setPartnerName] = useState(initialPartnerName ?? "");
  const [notificationEmail, setNotificationEmail] = useState(initialNotificationEmail);
  const [defaultSearchCity, setDefaultSearchCity] = useState(initialDefaultSearchCity ?? "");
  const [defaultSearchRadius, setDefaultSearchRadius] = useState(initialDefaultSearchRadius);
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [newChildName, setNewChildName] = useState("");
  const [newChildBirthYear, setNewChildBirthYear] = useState<string>("");
  const [newChildBirthMonth, setNewChildBirthMonth] = useState<string>("");
  const [newChildSpecialNeeds, setNewChildSpecialNeeds] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function saveProfile() {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          role,
          phone: phone || null,
          partner_name: partnerName || null,
          notification_email: notificationEmail,
          default_search_city: defaultSearchCity || null,
          default_search_radius: defaultSearchRadius,
        }),
      });
      if (res.ok) setMessage({ type: "success", text: "Profil gespeichert." });
      else setMessage({ type: "error", text: "Fehler beim Speichern." });
    } finally {
      setIsSaving(false);
    }
  }

  async function addChild() {
    if (!newChildName.trim()) return;
    const res = await fetch("/api/user/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newChildName,
        birth_year: newChildBirthYear ? Number(newChildBirthYear) : null,
        birth_month: newChildBirthMonth ? Number(newChildBirthMonth) : null,
        special_needs: newChildSpecialNeeds || null,
      }),
    });
    const data: { child?: Child } = await res.json();
    if (data.child) {
      setChildren((prev) => [...prev, data.child!]);
      setNewChildName("");
      setNewChildBirthYear("");
      setNewChildBirthMonth("");
      setNewChildSpecialNeeds("");
    }
  }

  async function removeChild(id: string) {
    await fetch(`/api/user/children/${id}`, { method: "DELETE" });
    setChildren((prev) => prev.filter((c) => c.id !== id));
  }

  async function exportData() {
    setIsExporting(true);
    try {
      const res = await fetch("/api/user/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kitaradar-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  async function deleteAccount() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setIsDeleting(true);
    await fetch("/api/user/account", { method: "DELETE" });
    window.location.href = "/";
  }

  return (
    <div className="space-y-6">
      {message && (
        <p className={`rounded-md px-3 py-2 text-sm ${
          message.type === "success"
            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        }`}>
          {message.text}
        </p>
      )}

      {/* Plan info */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Mein Plan</h2>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
            tier === "pro"
              ? "bg-primary/10 text-primary"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          }`}>
            {tier === "pro" ? "Pro" : "Free"}
          </span>
          {tier !== "pro" && (
            <span className="text-xs text-muted-foreground">
              {Math.max(0, 10 - searchCount)} von 10 Suchen übrig
            </span>
          )}
          {tier !== "pro" && (
            <Link href="/pricing" className="ml-auto text-xs font-medium text-primary hover:underline">
              Auf Pro upgraden →
            </Link>
          )}
          {role === "admin" && (
            <Link href="/admin" className="ml-auto flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
              <Shield className="h-3 w-3" /> Admin-Bereich
            </Link>
          )}
        </div>
      </div>

      {/* Persönliche Daten */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Persönliche Daten</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Vollständiger Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Telefonnummer</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49 123 456789"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Meine Rolle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {Object.entries(ROLE_LABELS).filter(([v]) => v !== "admin").map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Ihre Elternrolle in der gemeinsamen Kita-Suche
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Name {role === "mother" ? "des Vaters" : "der Mutter"} / Partner
              </label>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
              role === "admin"
                ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300"
                : role === "mother"
                ? "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300"
                : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300"
            }`}>
              {ROLE_ICONS[role] ?? ROLE_ICONS.parent}
              {ROLE_LABELS[role] ?? role}
            </span>
          </div>

          <button
            onClick={saveProfile}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Profil speichern
          </button>
        </div>
      </div>

      {/* Sucheinstellungen */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Standard-Sucheinstellungen</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Standard-Suchort
            </label>
            <input
              type="text"
              value={defaultSearchCity}
              onChange={(e) => setDefaultSearchCity(e.target.value)}
              placeholder="z.B. Frankfurt am Main"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Standard-Suchradius ({defaultSearchRadius} km)
            </label>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={defaultSearchRadius}
              onChange={(e) => setDefaultSearchRadius(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>
        </div>
        <button
          onClick={saveProfile}
          disabled={isSaving}
          className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Einstellungen speichern
        </button>
      </div>

      {/* Benachrichtigungen */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Benachrichtigungen</h2>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              {notificationEmail ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">E-Mail-Benachrichtigungen</p>
                <p className="text-xs text-muted-foreground">Informationen zu Bewerbungen, Antworten und Neuigkeiten</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notificationEmail}
              onClick={() => setNotificationEmail(!notificationEmail)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
                notificationEmail ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  notificationEmail ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        </div>
        <button
          onClick={saveProfile}
          disabled={isSaving}
          className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Speichern
        </button>
      </div>

      {/* Kinder */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Meine Kinder</h2>
        <div className="space-y-2">
          {children.map((child) => (
            <div key={child.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{child.name}</p>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  {(child.birth_year || child.birth_month) && (
                    <p className="text-xs text-muted-foreground">
                      Geb.: {child.birth_month ? `${child.birth_month}/` : ""}{child.birth_year}
                    </p>
                  )}
                  {child.special_needs && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-muted-foreground">
                      {child.special_needs}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeChild(child.id)}
                className="rounded-md p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Add child */}
          <div className="mt-3 space-y-2 rounded-lg border border-dashed border-border p-3">
            <p className="text-xs font-medium text-muted-foreground">Neues Kind</p>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                placeholder="Name des Kindes"
                className="flex-1 min-w-32 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
              <input
                type="number"
                value={newChildBirthMonth}
                onChange={(e) => setNewChildBirthMonth(e.target.value)}
                placeholder="Monat"
                min={1}
                max={12}
                className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
              <input
                type="number"
                value={newChildBirthYear}
                onChange={(e) => setNewChildBirthYear(e.target.value)}
                placeholder="Jahr"
                min={2018}
                max={new Date().getFullYear() + 1}
                className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <input
              type="text"
              value={newChildSpecialNeeds}
              onChange={(e) => setNewChildSpecialNeeds(e.target.value)}
              placeholder="Besondere Bedürfnisse / Hinweise (optional)"
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
            <button
              onClick={addChild}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Kind hinzufügen
            </button>
          </div>
        </div>
      </div>

      {/* Datenschutz & Konto */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Datenschutz & Konto</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportData}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 transition-colors"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Daten exportieren
          </button>

          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Konto löschen
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-900/20 w-full">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <span className="text-xs text-red-700 dark:text-red-400">
                Wirklich löschen? Alle Daten werden unwiderruflich gelöscht.
              </span>
              <button
                onClick={deleteAccount}
                disabled={isDeleting}
                className="ml-2 rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Ja, löschen"}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Abbrechen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
