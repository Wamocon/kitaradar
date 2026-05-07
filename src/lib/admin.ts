import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/** Returns true if the current session user has the admin role. */
export async function isAdminUser(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return data?.role === "admin";
}

/** Redirects to dashboard if not admin. Use in Server Components / layouts. */
export async function requireAdmin(locale = "de") {
  const admin = await isAdminUser();
  if (!admin) redirect(`/${locale}/dashboard`);
}
