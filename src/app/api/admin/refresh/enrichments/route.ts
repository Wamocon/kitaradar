import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// POST /api/admin/refresh/enrichments
// Re-fetches all stale enrichments (enriched_at < 72h ago) — with rate limiting
export async function POST() {
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

  // Find stale enrichments
  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const { data: stale, error } = await supabase
    .from("kita_enrichments")
    .select("osm_id, name")
    .lt("enriched_at", seventyTwoHoursAgo)
    .limit(20); // Rate limit: max 20 at a time

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!stale || stale.length === 0) {
    return NextResponse.json({ message: "Keine veralteten Einträge gefunden.", refreshed: 0 });
  }

  // Trigger re-enrichment for each stale entry (fire and forget with delay)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let refreshed = 0;

  for (const entry of stale) {
    try {
      // Delete the stale entry so it gets re-fetched on next modal open
      await supabase.from("kita_enrichments").delete().eq("osm_id", entry.osm_id);
      refreshed++;
    } catch {
      // Continue on error
    }
    // Simple rate limiting: 50ms between operations
    await new Promise((r) => setTimeout(r, 50));
  }

  void baseUrl; // suppress unused warning

  return NextResponse.json({
    message: `${refreshed} veraltete Einträge zurückgesetzt. Sie werden beim nächsten Aufruf neu angereichert.`,
    refreshed,
  });
}
