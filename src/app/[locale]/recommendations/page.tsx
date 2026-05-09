import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { RecommendationsClient } from "@/components/recommendations/RecommendationsClient";

export const metadata: Metadata = {
  title: "KI-Empfehlungen – KitaRadar",
  description: "Personalisierte Kita-Empfehlungen basierend auf Ihrem Kinderprofil und Ihren Präferenzen.",
};

export default async function RecommendationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [profileRes, childrenRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, subscription_tier, default_search_city, default_search_radius, preferred_pedagogy, preferred_kita_type, preferred_languages, preferred_hours"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("children")
      .select("id, name, birth_year, birth_month, special_needs")
      .eq("profile_id", user.id),
  ]);

  const profile = profileRes.data;
  const children = childrenRes.data ?? [];
  const isPro = profile?.subscription_tier === "pro";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">KI-Kita-Empfehlungen</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Personalisierte Vorschläge basierend auf Ihrem Profil und den Bedürfnissen Ihres Kindes
            </p>
          </div>
          <RecommendationsClient
            isPro={isPro}
            profile={profile}
            userChildren={children}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
