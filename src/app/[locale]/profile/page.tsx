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
    supabase.from("profiles").select("full_name, tier, search_count, role, phone, partner_name, notification_email, default_search_city, default_search_radius").eq("id", user.id).single(),
    supabase.from("children").select("*").eq("profile_id", user.id),
  ]);

  const profile = profileRes.data;
  const children = childrenRes.data ?? [];

  const t = await getTranslations("profile");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-2xl font-bold text-foreground">{t("title")}</h1>
          <ProfileClient
            initialName={profile?.full_name ?? ""}
            initialChildren={children}
            tier={profile?.tier ?? "free"}
            searchCount={profile?.search_count ?? 0}
            role={profile?.role ?? "parent"}
            phone={profile?.phone ?? ""}
            partnerName={profile?.partner_name ?? ""}
            notificationEmail={profile?.notification_email ?? true}
            defaultSearchCity={profile?.default_search_city ?? ""}
            defaultSearchRadius={profile?.default_search_radius ?? 5}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
