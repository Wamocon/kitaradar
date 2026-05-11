import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applications: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body: {
    kita_id?: string;
    kita_name: string;
    kita_email?: string;
    child_id?: string;
    cover_letter?: string;
    status?: string;
  } = await request.json();

  if (!body.kita_name) {
    return NextResponse.json({ error: "kita_name required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({
      profile_id: user.id,
      kita_id: body.kita_id ?? null,
      kita_name: body.kita_name,
      kita_email: body.kita_email ?? null,
      child_id: body.child_id ?? null,
      cover_letter: body.cover_letter ?? null,
      status: body.status ?? "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ application: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body: { id: string; status?: string; notes?: string; response_at?: string } = await request.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("applications")
    .update({
      ...(body.status    !== undefined && { status:      body.status }),
      ...(body.notes     !== undefined && { notes:       body.notes }),
      ...(body.response_at !== undefined && { response_at: body.response_at }),
    })
    .eq("id", body.id)
    .eq("profile_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ application: data });
}
