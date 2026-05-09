import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  // Atomic increment via RPC (simple increment without tracking unique voters)
  const { error } = await supabase.rpc("increment_upvotes", { post_id: id });
  if (error) {
    // Fallback if RPC not available: read + write
    const { data: post } = await supabase
      .from("feed_posts")
      .select("upvotes")
      .eq("id", id)
      .single();
    if (post) {
      await supabase
        .from("feed_posts")
        .update({ upvotes: (post.upvotes ?? 0) + 1 })
        .eq("id", id);
    }
  }

  return NextResponse.json({ success: true });
}
