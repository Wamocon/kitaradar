import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");

  let query = supabase
    .from("feed_posts")
    .select(
      `id, title, content, tag, upvotes, created_at,
       profiles!feed_posts_profile_id_fkey(full_name)`
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (tag) {
    query = query.eq("tag", tag);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Pro-gate: only Pro users can post
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (!profile || profile.tier !== "pro") {
    return NextResponse.json({ error: "pro_required" }, { status: 403 });
  }

  const body: { title: string; content: string; tag?: string } = await request.json();
  if (!body.title || !body.content) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("feed_posts")
    .insert({
      profile_id: user.id,
      title: body.title,
      content: body.content,
      tag: body.tag ?? "general",
      upvotes: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data }, { status: 201 });
}
