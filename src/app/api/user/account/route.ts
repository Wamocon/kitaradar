import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = await createAdminClient();

  // Delete user data (cascade via RLS + FK); then delete auth user
  await supabase.from("applications").delete().eq("profile_id", user.id);
  await supabase.from("children").delete().eq("profile_id", user.id);
  await supabase.from("feed_posts").delete().eq("profile_id", user.id);
  await supabase.from("subscriptions").delete().eq("profile_id", user.id);
  await supabase.from("profiles").delete().eq("id", user.id);

  await admin.auth.admin.deleteUser(user.id);

  return NextResponse.json({ success: true });
}
