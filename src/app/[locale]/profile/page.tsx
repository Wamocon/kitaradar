import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProfileClient } from "@/components/profile/ProfileClient";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile");
  return { title: t("title") };
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [profileRes, childrenRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, subscription_tier, search_count_month, role, phone, partner_name, notification_email, default_search_city, default_search_radius, preferred_pedagogy, preferred_kita_type, preferred_languages, preferred_hours, job_title, employer, work_district, work_hours_type, work_start_time, work_end_time, family_situation, home_language, additional_languages, max_monthly_fee, kita_needed_from, ai_consent"
      )
      .eq("id", user.id)
      .single(),
    supabase.from("children").select("*").eq("profile_id", user.id),
  ]);

  const profile = profileRes.data;
  const children = childrenRes.data ?? [];

  const t = await getTranslations("profile");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-2xl font-bold text-foreground">{t("title")}</h1>
          <ProfileClient
            initialName={profile?.full_name ?? ""}
            initialChildren={children}
            tier={profile?.subscription_tier ?? "free"}
            searchCount={profile?.search_count_month ?? 0}
            role={profile?.role ?? "parent"}
            phone={profile?.phone ?? ""}
            partnerName={profile?.partner_name ?? ""}
            notificationEmail={profile?.notification_email ?? true}
            defaultSearchCity={profile?.default_search_city ?? ""}
            defaultSearchRadius={profile?.default_search_radius ?? 5}
            preferredPedagogy={profile?.preferred_pedagogy ?? ""}
            preferredKitaType={profile?.preferred_kita_type ?? ""}
            preferredLanguages={profile?.preferred_languages ?? ""}
            preferredHours={profile?.preferred_hours ?? ""}
            jobTitle={profile?.job_title ?? ""}
            employer={profile?.employer ?? ""}
            workDistrict={profile?.work_district ?? ""}
            workHoursType={profile?.work_hours_type ?? ""}
            workStartTime={profile?.work_start_time ?? ""}
            workEndTime={profile?.work_end_time ?? ""}
            familySituation={profile?.family_situation ?? ""}
            homeLanguage={profile?.home_language ?? ""}
            additionalLanguages={profile?.additional_languages ?? ""}
            maxMonthlyFee={profile?.max_monthly_fee ?? null}
            kitaNeededFrom={profile?.kita_needed_from ?? ""}
            aiConsent={profile?.ai_consent ?? false}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
