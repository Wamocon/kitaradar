import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body: { ids?: string[]; all?: boolean } = await request.json().catch(() => ({}));

  if (body.all) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("profile_id", user.id);
  } else if (body.ids?.length) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", body.ids)
      .eq("profile_id", user.id);
  }

  return NextResponse.json({ success: true });
}
