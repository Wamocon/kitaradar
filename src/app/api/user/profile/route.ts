import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body: {
    full_name?: string;
    role?: string;
    phone?: string | null;
    partner_name?: string | null;
    notification_email?: boolean;
    default_search_city?: string | null;
    default_search_radius?: number;
  } = await request.json();

  // Users cannot self-assign admin role
  const safeRole = body.role === "admin" ? undefined : body.role;

  const update: Record<string, unknown> = {};
  if (body.full_name !== undefined) update.full_name = body.full_name;
  if (safeRole !== undefined) update.role = safeRole;
  if (body.phone !== undefined) update.phone = body.phone;
  if (body.partner_name !== undefined) update.partner_name = body.partner_name;
  if (body.notification_email !== undefined) update.notification_email = body.notification_email;
  if (body.default_search_city !== undefined) update.default_search_city = body.default_search_city;
  if (body.default_search_radius !== undefined) {
    const r = Number(body.default_search_radius);
    if (r >= 1 && r <= 100) update.default_search_radius = r;
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
