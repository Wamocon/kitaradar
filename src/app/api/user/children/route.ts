import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body: {
    name: string;
    birth_year?: number | null;
    birth_month?: number | null;
    special_needs?: string | null;
  } = await request.json();

  if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("children")
    .insert({
      profile_id: user.id,
      name: body.name,
      birth_year: body.birth_year ?? null,
      birth_month: body.birth_month ?? null,
      special_needs: body.special_needs ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ child: data }, { status: 201 });
}
