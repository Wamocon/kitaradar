import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { ApplicationsClient } from "@/components/search/ApplicationsClient";

export const metadata: Metadata = { title: "Meine Bewerbungen – KitaRadar" };

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col bg-background">
        <div className="mx-auto w-full max-w-4xl px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">Meine Bewerbungen</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Verwalten Sie Ihre Kita-Bewerbungen und pflegen Sie den aktuellen Status.
            </p>
          </div>
          <ApplicationsClient initialApplications={applications ?? []} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
