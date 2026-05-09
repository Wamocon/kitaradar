import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const adminOk = await isAdminUser();
  if (!adminOk) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const body: { role?: string; subscription_tier?: string } = await request.json();

  // Validate inputs
  const validRoles = ["admin", "mother", "father", "parent"];
  const validTiers = ["free", "pro"];

  if (body.role !== undefined && !validRoles.includes(body.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (body.subscription_tier !== undefined && !validTiers.includes(body.subscription_tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const update: Record<string, string> = {};
  if (body.role !== undefined) update.role = body.role;
  if (body.subscription_tier !== undefined) update.subscription_tier = body.subscription_tier;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: Request, { params }: RouteParams) {
  const adminOk = await isAdminUser();
  if (!adminOk) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, subscription_tier, search_count_month, created_at, phone, partner_name")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
