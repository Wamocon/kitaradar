"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Loader2, Plus, Trash2, Download, AlertTriangle, Bell, BellOff,
  MapPin, Shield, User, Sparkles, Briefcase, Baby, Euro, Calendar,
} from "lucide-react";
import { DataPrivacyConsentDialog } from "./DataPrivacyConsentDialog";
import { useTranslations } from "next-intl";

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
  // AI Preferences
  preferredPedagogy?: string | null;
  preferredKitaType?: string | null;
  preferredLanguages?: string | null;
  preferredHours?: string | null;
  // Extended parent profile
  jobTitle?: string | null;
  employer?: string | null;
  workDistrict?: string | null;
  workHoursType?: string | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
  familySituation?: string | null;
  homeLanguage?: string | null;
  additionalLanguages?: string | null;
  maxMonthlyFee?: number | null;
  kitaNeededFrom?: string | null;
  aiConsent?: boolean;
}


const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield className="h-3 w-3" />,
  mother: <User className="h-3 w-3" />,
  father: <User className="h-3 w-3" />,
  parent: <User className="h-3 w-3" />,
};

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30";

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
  preferredPedagogy: initialPreferredPedagogy = "",
  preferredKitaType: initialPreferredKitaType = "",
  preferredLanguages: initialPreferredLanguages = "",
  preferredHours: initialPreferredHours = "",
  jobTitle: initialJobTitle = "",
  employer: initialEmployer = "",
  workDistrict: initialWorkDistrict = "",
  workHoursType: initialWorkHoursType = "",
  workStartTime: initialWorkStartTime = "",
  workEndTime: initialWorkEndTime = "",
  familySituation: initialFamilySituation = "",
  homeLanguage: initialHomeLanguage = "",
  additionalLanguages: initialAdditionalLanguages = "",
  maxMonthlyFee: initialMaxMonthlyFee = null,
  kitaNeededFrom: initialKitaNeededFrom = "",
  aiConsent: initialAiConsent = false,
}: ProfileClientProps) {
  // Basic profile state
  const [fullName, setFullName] = useState(initialName);
  const [role, setRole] = useState(initialRole);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [partnerName, setPartnerName] = useState(initialPartnerName ?? "");
  const [notificationEmail, setNotificationEmail] = useState(initialNotificationEmail);
  const [defaultSearchCity, setDefaultSearchCity] = useState(initialDefaultSearchCity ?? "");
  const [defaultSearchRadius, setDefaultSearchRadius] = useState(initialDefaultSearchRadius);
  // AI preferences state
  const [preferredPedagogy, setPreferredPedagogy] = useState(initialPreferredPedagogy ?? "");
  const [preferredKitaType, setPreferredKitaType] = useState(initialPreferredKitaType ?? "");
  const [preferredLanguages, setPreferredLanguages] = useState(initialPreferredLanguages ?? "");
  const [preferredHours, setPreferredHours] = useState(initialPreferredHours ?? "");
  // Extended parent profile state
  const [jobTitle, setJobTitle] = useState(initialJobTitle ?? "");
  const [employer, setEmployer] = useState(initialEmployer ?? "");
  const [workDistrict, setWorkDistrict] = useState(initialWorkDistrict ?? "");
  const [workHoursType, setWorkHoursType] = useState(initialWorkHoursType ?? "");
  const [workStartTime, setWorkStartTime] = useState(initialWorkStartTime ?? "");
  const [workEndTime, setWorkEndTime] = useState(initialWorkEndTime ?? "");
  const [familySituation, setFamilySituation] = useState(initialFamilySituation ?? "");
  const [homeLanguage, setHomeLanguage] = useState(initialHomeLanguage ?? "");
  const [additionalLanguages, setAdditionalLanguages] = useState(initialAdditionalLanguages ?? "");
  const [maxMonthlyFee, setMaxMonthlyFee] = useState(initialMaxMonthlyFee?.toString() ?? "");
  const [kitaNeededFrom, setKitaNeededFrom] = useState(initialKitaNeededFrom ?? "");
  const [aiConsent, setAiConsent] = useState(initialAiConsent);
  // Children state
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [newChildName, setNewChildName] = useState("");
  const [newChildBirthYear, setNewChildBirthYear] = useState("");
  const [newChildBirthMonth, setNewChildBirthMonth] = useState("");
  const [newChildSpecialNeeds, setNewChildSpecialNeeds] = useState("");
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childError, setChildError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  // GDPR consent dialog state
  const [consentPending, setConsentPending] = useState<"extended_profile" | "ai_preferences" | null>(null);
  const [pendingSavePayload, setPendingSavePayload] = useState<Record<string, unknown> | null>(null);
  // Tab navigation
  const [activeTab, setActiveTab] = useState("personal");

  const t = useTranslations("profile");

  function buildPayload(): Record<string, unknown> {
    return {
      full_name: fullName,
      role,
      phone: phone || null,
      partner_name: partnerName || null,
      notification_email: notificationEmail,
      default_search_city: defaultSearchCity || null,
      default_search_radius: defaultSearchRadius,
      preferred_pedagogy: preferredPedagogy || null,
      preferred_kita_type: preferredKitaType || null,
      preferred_languages: preferredLanguages || null,
      preferred_hours: preferredHours || null,
      job_title: jobTitle || null,
      employer: employer || null,
      work_district: workDistrict || null,
      work_hours_type: workHoursType || null,
      work_start_time: workStartTime || null,
      work_end_time: workEndTime || null,
      family_situation: familySituation || null,
      home_language: homeLanguage || null,
      additional_languages: additionalLanguages || null,
      max_monthly_fee: maxMonthlyFee ? Number(maxMonthlyFee) : null,
      kita_needed_from: kitaNeededFrom || null,
      ai_consent: aiConsent,
    };
  }

  const hasExtendedData = !!(
    jobTitle || employer || workDistrict || workHoursType ||
    familySituation || homeLanguage || kitaNeededFrom || maxMonthlyFee
  );

  async function handleSave() {
    if (hasExtendedData && !aiConsent) {
      setPendingSavePayload(buildPayload());
      setConsentPending("extended_profile");
      return;
    }
    await doSave(buildPayload());
  }

  async function doSave(payload: Record<string, unknown>) {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMessage({ type: "success", text: t("save_success") });
      } else {
        setMessage({ type: "error", text: t("save_error") });
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function onConsentAccept() {
    setAiConsent(true);
    const payload = { ...pendingSavePayload, ai_consent: true };
    setConsentPending(null);
    setPendingSavePayload(null);
    await doSave(payload as Record<string, unknown>);
  }

  function onConsentDecline() {
    setConsentPending(null);
    setPendingSavePayload(null);
  }

  async function addChild() {
    if (!newChildName.trim()) return;
    setIsAddingChild(true);
    setChildError(null);
    try {
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
      const data: { child?: Child; error?: string } = await res.json();
      if (data.child) {
        setChildren((prev) => [...prev, data.child!]);
        setNewChildName("");
        setNewChildBirthYear("");
        setNewChildBirthMonth("");
        setNewChildSpecialNeeds("");
      } else {
        setChildError(data.error ?? t("save_error"));
      }
    } catch {
      setChildError(t("save_error"));
    } finally {
      setIsAddingChild(false);
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
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setIsDeleting(true);
    await fetch("/api/user/account", { method: "DELETE" });
    window.location.href = "/";
  }

  function SaveBtn({ label }: { label?: string }) {
    const btnLabel = label ?? t("personal.save");
    return (
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
        {btnLabel}
      </button>
    );
  }

  const consentBanner = !aiConsent && hasExtendedData && (
    <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
      <Shield className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="text-xs text-amber-800 dark:text-amber-300">
        {t("consent.pending")}
      </p>
    </div>
  );

  return (
    <>
      {consentPending && (
        <DataPrivacyConsentDialog
          context={consentPending}
          onAccept={onConsentAccept}
          onDecline={onConsentDecline}
        />
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        {/* ──────────── SIDEBAR NAVIGATION ──────────── */}
        <nav className="lg:w-52 lg:shrink-0">
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1 lg:flex-col lg:overflow-x-visible">
            {([
              { id: "plan",          label: t("tabs.plan"),          Icon: User },
              { id: "personal",      label: t("tabs.personal"),      Icon: User },
              { id: "family",        label: t("tabs.family"),        Icon: User },
              { id: "work",          label: t("tabs.work"),          Icon: Briefcase },
              { id: "childcare",     label: t("tabs.childcare"),     Icon: Calendar },
              { id: "children",      label: t("tabs.children"),      Icon: Baby },
              { id: "ki",            label: t("tabs.ki"),            Icon: Sparkles },
              { id: "notifications", label: t("tabs.notifications"), Icon: Bell },
              { id: "privacy",       label: t("tabs.privacy"),       Icon: Shield },
            ] as const).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:w-full lg:whitespace-normal ${
                  activeTab === id
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* ──────────── MAIN CONTENT ──────────── */}
        <div className="min-w-0 flex-1 space-y-4">
        {message && (
          <p
            className={`rounded-md px-3 py-2 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}

        {/* Consent banners */}
        {aiConsent && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-2.5">
            <Shield className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <p className="text-xs text-green-800 dark:text-green-300">
              {t("consent.active")}{" "}
              <button
                className="underline hover:no-underline"
                onClick={async () => {
                  setAiConsent(false);
                  await doSave({ ai_consent: false });
                }}
              >
                {t("consent.revoke")}
              </button>
            </p>
          </div>
        )}

        {consentBanner}

        {/* ──────────── PLAN INFO ──────────── */}
        {activeTab === "plan" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader icon={User} title={t("plan.title")} />
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                tier === "pro"
                  ? "bg-primary/10 text-primary"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {tier === "pro" ? "Pro" : "Free"}
            </span>
            {tier !== "pro" && (
              <span className="text-xs text-muted-foreground">
                {t("plan.searches_remaining", { remaining: Math.max(0, 10 - searchCount) })}
              </span>
            )}
            {tier !== "pro" && (
              <Link href="/pricing" className="ml-auto text-xs font-medium text-primary hover:underline">
                {t("plan.upgrade_link")}
              </Link>
            )}
            {role === "admin" && (
              <Link
                href="/admin"
                className="ml-auto flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
              >
                <Shield className="h-3 w-3" /> {t("plan.admin_area")}
              </Link>
            )}
          </div>
        </div>
        )}

        {/* ──────────── PERSÖNLICHE DATEN ──────────── */}
        {activeTab === "personal" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader icon={User} title={t("personal.title")} description={t("personal.desc")} />
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>{t("personal.full_name")}</FieldLabel>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <FieldLabel>{t("personal.phone")}</FieldLabel>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("personal.phone_placeholder")}
                  className={inputCls}
                />
              </div>
              <div>
                <FieldLabel>{t("personal.role")}</FieldLabel>
                <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
                  {(["mother", "father", "parent"] as const).map((v) => (
                    <option key={v} value={v}>
                      {t(`roles.${v}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>{t("personal.partner")}</FieldLabel>
                <input
                  type="text"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder={t("personal.partner_placeholder")}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                  role === "admin"
                    ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300"
                    : role === "mother"
                    ? "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/40 dark:text-pink-300"
                    : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300"
                }`}
              >
                {ROLE_ICONS[role] ?? ROLE_ICONS.parent}
                {t(`roles.${role}` as `roles.${"admin" | "mother" | "father" | "parent"}`) ?? role}
              </span>
            </div>
            <SaveBtn label={t("personal.save")} />
          </div>
        </div>
        )}

        {/* ──────────── FAMILIENSITUATION ──────────── */}
        {activeTab === "family" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader
            icon={User}
            title={t("family.title")}
            description={t("family.desc")}
          />
          {!aiConsent && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2.5">
              <Shield className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-blue-800 dark:text-blue-300">
                {t("consent.required_hint")}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>{t("family.situation")}</FieldLabel>
              <select
                value={familySituation}
                onChange={(e) => setFamilySituation(e.target.value)}
                className={inputCls}
              >
                <option value="">{t("family_situations.none")}</option>
                <option value="two_parent">{t("family_situations.two_parent")}</option>
                <option value="single_parent">{t("family_situations.single_parent")}</option>
                <option value="shared_custody">{t("family_situations.shared_custody")}</option>
                <option value="patchwork">{t("family_situations.patchwork")}</option>
                <option value="grandparent">{t("family_situations.grandparent")}</option>
              </select>
            </div>
            <div>
              <FieldLabel>{t("family.home_language")}</FieldLabel>
              <select
                value={homeLanguage}
                onChange={(e) => setHomeLanguage(e.target.value)}
                className={inputCls}
              >
                <option value="">{t("languages.none")}</option>
                <option value="deutsch">{t("languages.deutsch")}</option>
                <option value="türkisch">{t("languages.tuerkisch")}</option>
                <option value="arabisch">{t("languages.arabisch")}</option>
                <option value="russisch">{t("languages.russisch")}</option>
                <option value="englisch">{t("languages.englisch")}</option>
                <option value="polnisch">{t("languages.polnisch")}</option>
                <option value="rumänisch">{t("languages.rumaenisch")}</option>
                <option value="sonstige">{t("languages.sonstige")}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>{t("family.additional_languages")}</FieldLabel>
              <input
                type="text"
                value={additionalLanguages}
                onChange={(e) => setAdditionalLanguages(e.target.value)}
                placeholder={t("family.additional_hint")}
                className={inputCls}
              />
            </div>
          </div>
          <div className="mt-3">
            <SaveBtn label={t("family.save")} />
          </div>
        </div>
        )}

        {/* ──────────── BERUF & ARBEITSZEIT ──────────── */}
        {activeTab === "work" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader
            icon={Briefcase}
            title={t("work.title")}
            description={t("work.desc")}
          />
          {!aiConsent && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-2.5">
              <Shield className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-blue-800 dark:text-blue-300">
                {t("consent.sensitive_hint")}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>{t("work.job_title")}</FieldLabel>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={t("work.job_placeholder")}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel>{t("work.employer")}</FieldLabel>
              <input
                type="text"
                value={employer}
                onChange={(e) => setEmployer(e.target.value)}
                placeholder={t("work.employer_placeholder")}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel>{t("work.district")}</FieldLabel>
              <input
                type="text"
                value={workDistrict}
                onChange={(e) => setWorkDistrict(e.target.value)}
                placeholder={t("work.district_placeholder")}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t("work.district_hint")}</p>
            </div>
            <div>
              <FieldLabel>{t("work.hours_type")}</FieldLabel>
              <select
                value={workHoursType}
                onChange={(e) => setWorkHoursType(e.target.value)}
                className={inputCls}
              >
                <option value="">{t("work_hours.none")}</option>
                <option value="full_time">{t("work_hours.full_time")}</option>
                <option value="part_time">{t("work_hours.part_time")}</option>
                <option value="flex">{t("work_hours.flex")}</option>
                <option value="shift">{t("work_hours.shift")}</option>
                <option value="home_office">{t("work_hours.home_office")}</option>
                <option value="parental_leave">{t("work_hours.parental_leave")}</option>
              </select>
            </div>
            <div>
              <FieldLabel>{t("work.start_time")}</FieldLabel>
              <input
                type="time"
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel>{t("work.end_time")}</FieldLabel>
              <input
                type="time"
                value={workEndTime}
                onChange={(e) => setWorkEndTime(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="mt-3">
            <SaveBtn label={t("work.save")} />
          </div>
        </div>
        )}

        {/* ──────────── BETREUUNGSBEDARF ──────────── */}
        {activeTab === "childcare" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader
            icon={Calendar}
            title={t("childcare.title")}
            description={t("childcare.desc")}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>{t("childcare.needed_from")}</FieldLabel>
              <input
                type="date"
                value={kitaNeededFrom}
                onChange={(e) => setKitaNeededFrom(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t("childcare.needed_from_hint")}</p>
            </div>
            <div>
              <FieldLabel>{t("childcare.max_fee")}</FieldLabel>
              <div className="relative">
                <Euro className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  min={0}
                  max={3000}
                  step={50}
                  value={maxMonthlyFee}
                  onChange={(e) => setMaxMonthlyFee(e.target.value)}
                  placeholder={t("childcare.max_fee_placeholder")}
                  className={`${inputCls} pl-9`}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{t("childcare.max_fee_hint")}</p>
            </div>
          </div>
          <div className="mt-3">
            <SaveBtn label={t("childcare.save")} />
          </div>
        </div>
        )}

        {/* ──────────── KINDER ──────────── */}
        {activeTab === "children" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader icon={Baby} title={t("children.title")} description={t("children.desc")} />
          <div className="space-y-2">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{child.name}</p>
                  <div className="mt-0.5 flex flex-wrap gap-2">
                    {(child.birth_year || child.birth_month) && (
                      <p className="text-xs text-muted-foreground">
                        {t("children.born_label")}:{" "}
                        {child.birth_month ? `${String(child.birth_month).padStart(2, "0")}/` : ""}
                        {child.birth_year}
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
                  aria-label={`Remove ${child.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <div className="mt-3 space-y-2 rounded-lg border border-dashed border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">{t("children.new_child")}</p>
              {childError && (
                <p className="rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-700 dark:text-red-400">{childError}</p>
              )}
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">{t("children.child_name_placeholder")}</label>
                  <input
                    type="text"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    placeholder={t("children.child_name_placeholder")}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="w-20">
                  <label className="mb-1 block text-xs text-muted-foreground">{t("children.birth_month")}</label>
                  <input
                    type="number"
                    value={newChildBirthMonth}
                    onChange={(e) => setNewChildBirthMonth(e.target.value)}
                    placeholder="MM"
                    min={1}
                    max={12}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="w-24">
                  <label className="mb-1 block text-xs text-muted-foreground">{t("children.birth_year")}</label>
                  <input
                    type="number"
                    value={newChildBirthYear}
                    onChange={(e) => setNewChildBirthYear(e.target.value)}
                    placeholder="JJJJ"
                    min={2018}
                    max={new Date().getFullYear() + 1}
                    className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <input
                type="text"
                value={newChildSpecialNeeds}
                onChange={(e) => setNewChildSpecialNeeds(e.target.value)}
                placeholder={t("children.special_needs_placeholder")}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
              <button
                onClick={addChild}
                disabled={isAddingChild}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isAddingChild ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t("children.add_btn")}
              </button>
            </div>
          </div>
        </div>
        )}

        {/* ──────────── KI-PRÄFERENZEN ──────────── */}
        {activeTab === "ki" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader
            icon={Sparkles}
            title={t("ki.title")}
            description={t("ki.desc")}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>{t("ki.pedagogy")}</FieldLabel>
              <select
                value={preferredPedagogy}
                onChange={(e) => setPreferredPedagogy(e.target.value)}
                className={inputCls}
              >
                <option value="">{t("no_preference")}</option>
                <option value="montessori">{t("pedagogy.montessori")}</option>
                <option value="waldorf">{t("pedagogy.waldorf")}</option>
                <option value="reggio">{t("pedagogy.reggio")}</option>
                <option value="situationsansatz">{t("pedagogy.situationsansatz")}</option>
                <option value="pikler">{t("pedagogy.pikler")}</option>
                <option value="sonstige">{t("pedagogy.sonstige")}</option>
              </select>
            </div>
            <div>
              <FieldLabel>{t("ki.kita_type")}</FieldLabel>
              <select
                value={preferredKitaType}
                onChange={(e) => setPreferredKitaType(e.target.value)}
                className={inputCls}
              >
                <option value="">{t("no_preference")}</option>
                <option value="public">{t("kita_type_pref.public")}</option>
                <option value="church">{t("kita_type_pref.church")}</option>
                <option value="private">{t("kita_type_pref.private")}</option>
                <option value="free">{t("kita_type_pref.free")}</option>
              </select>
            </div>
            <div>
              <FieldLabel>{t("ki.languages")}</FieldLabel>
              <input
                type="text"
                value={preferredLanguages}
                onChange={(e) => setPreferredLanguages(e.target.value)}
                placeholder={t("ki.languages_placeholder")}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel>{t("ki.hours")}</FieldLabel>
              <select
                value={preferredHours}
                onChange={(e) => setPreferredHours(e.target.value)}
                className={inputCls}
              >
                <option value="">{t("no_preference")}</option>
                <option value="halbtags">{t("care_hours.halbtags")}</option>
                <option value="nachmittags">{t("care_hours.nachmittags")}</option>
                <option value="ganztags">{t("care_hours.ganztags")}</option>
                <option value="erweitert">{t("care_hours.erweitert")}</option>
              </select>
            </div>
          </div>
          <p className="mt-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 px-3 py-2 text-xs text-violet-700 dark:text-violet-300">
            {t("ki.info")}
          </p>
          <div className="mt-3">
            <SaveBtn label={t("ki.save")} />
          </div>
        </div>
        )}

        {/* ──────────── SUCHEINSTELLUNGEN + BENACHRICHTIGUNGEN ──────────── */}
        {activeTab === "notifications" && (<>
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader icon={MapPin} title={t("search_settings.title")} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>{t("search_settings.city")}</FieldLabel>
              <input
                type="text"
                value={defaultSearchCity}
                onChange={(e) => setDefaultSearchCity(e.target.value)}
                placeholder={t("search_settings.city_placeholder")}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel>{t("search_settings.radius", { radius: defaultSearchRadius })}</FieldLabel>
              <input
                type="range"
                min={1}
                max={50}
                step={1}
                value={defaultSearchRadius}
                onChange={(e) => setDefaultSearchRadius(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <SaveBtn label={t("search_settings.save")} />
          </div>
        </div>

        {/* ──────────── BENACHRICHTIGUNGEN ──────────── */}
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader icon={Bell} title={t("notifications_tab.title")} />
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              {notificationEmail ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{t("notifications_tab.email_label")}</p>
                <p className="text-xs text-muted-foreground">{t("notifications_tab.email_desc")}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notificationEmail}
              onClick={() => setNotificationEmail((v) => !v)}
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
          <div className="mt-3">
            <SaveBtn label={t("notifications_tab.save")} />
          </div>
        </div>
        </>)}
        {activeTab === "privacy" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <SectionHeader icon={Shield} title={t("privacy_tab.title")} />
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportData}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 transition-colors"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {t("privacy_tab.export")}
            </button>
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" /> {t("privacy_tab.delete")}
              </button>
            ) : (
              <div className="flex w-full flex-wrap items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span className="text-xs text-red-700 dark:text-red-400">
                  {t("privacy_tab.delete_confirm_text")}
                </span>
                <button
                  onClick={deleteAccount}
                  disabled={isDeleting}
                  className="ml-auto rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : t("privacy_tab.delete_final")}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("privacy_tab.cancel")}
                </button>
              </div>
            )}
          </div>
          {aiConsent && (
            <div className="mt-4 rounded-lg border border-border bg-accent/30 p-3">
              <p className="text-xs text-muted-foreground">
                {t("privacy_tab.consent_info")}
              </p>
            </div>
          )}
        </div>
        )}
        </div>{/* end flex-1 main content */}
      </div>{/* end flex-row layout */}
    </>
  );
}
