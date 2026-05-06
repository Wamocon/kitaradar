"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Plus, Trash2, Download, AlertTriangle } from "lucide-react";

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
}

export function ProfileClient({ initialName, initialChildren, tier, searchCount }: ProfileClientProps) {
  const [fullName, setFullName] = useState(initialName);
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [newChildName, setNewChildName] = useState("");
  const [newChildBirthYear, setNewChildBirthYear] = useState<string>("");
  const [newChildBirthMonth, setNewChildBirthMonth] = useState<string>("");
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
        body: JSON.stringify({ full_name: fullName }),
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
      }),
    });
    const data: { child?: Child } = await res.json();
    if (data.child) {
      setChildren((prev) => [...prev, data.child!]);
      setNewChildName("");
      setNewChildBirthYear("");
      setNewChildBirthMonth("");
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
    <div className="space-y-8">
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
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Ihr Plan</h2>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
            tier === "pro"
              ? "bg-primary/10 text-primary"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          }`}>
            {tier === "pro" ? "Pro" : "Free"}
          </span>
          {tier !== "pro" && (
            <span className="text-xs text-muted">
              {Math.max(0, 10 - searchCount)} von 10 Suchen übrig
            </span>
          )}
          {tier !== "pro" && (
            <Link href="/pricing" className="ml-auto text-xs font-medium text-primary hover:underline">
              Auf Pro upgraden →
            </Link>
          )}
        </div>
      </div>

      {/* Profile info */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Persönliche Daten</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button
            onClick={saveProfile}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Speichern
          </button>
        </div>
      </div>

      {/* Children */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Meine Kinder</h2>
        <div className="space-y-2">
          {children.map((child) => (
            <div
              key={child.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{child.name}</p>
                {(child.birth_year || child.birth_month) && (
                  <p className="text-xs text-muted">
                    {child.birth_month ? `${child.birth_month}/` : ""}{child.birth_year}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeChild(child.id)}
                className="rounded-md p-1 text-muted hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Add child */}
          <div className="flex flex-wrap gap-2 pt-2">
            <input
              type="text"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              placeholder="Name des Kindes"
              className="flex-1 min-w-32 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="number"
              value={newChildBirthMonth}
              onChange={(e) => setNewChildBirthMonth(e.target.value)}
              placeholder="Monat"
              min={1}
              max={12}
              className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="number"
              value={newChildBirthYear}
              onChange={(e) => setNewChildBirthYear(e.target.value)}
              placeholder="Jahr"
              min={2018}
              max={new Date().getFullYear() + 1}
              className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
            <button
              onClick={addChild}
              className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> Kind hinzufügen
            </button>
          </div>
        </div>
      </div>

      {/* Data privacy */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Datenschutz & Konto</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportData}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-border/40 disabled:opacity-50 transition-colors"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Daten exportieren
          </button>

          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Konto löschen
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
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
                className="text-xs text-muted hover:text-foreground"
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
