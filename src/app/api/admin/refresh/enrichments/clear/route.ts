import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// DELETE /api/admin/refresh/enrichments/clear
// Removes all stale enrichments (enriched_at < 72h ago) from cache
export async function DELETE() {
  const supabase = await createClient();

  // Admin check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("kita_enrichments")
    .delete({ count: "exact" })
    .lt("enriched_at", seventyTwoHoursAgo);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `${count ?? 0} veraltete Cache-Einträge gelöscht.`,
    deleted: count ?? 0,
  });
}
