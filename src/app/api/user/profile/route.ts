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
    preferred_pedagogy?: string | null;
    preferred_kita_type?: string | null;
    preferred_languages?: string | null;
    preferred_hours?: string | null;
    // Extended parent fields
    job_title?: string | null;
    employer?: string | null;
    work_district?: string | null;
    work_hours_type?: string | null;
    work_start_time?: string | null;
    work_end_time?: string | null;
    family_situation?: string | null;
    home_language?: string | null;
    additional_languages?: string | null;
    max_monthly_fee?: number | null;
    kita_needed_from?: string | null;
    ai_consent?: boolean;
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
  // AI Preferences
  if (body.preferred_pedagogy !== undefined) update.preferred_pedagogy = body.preferred_pedagogy;
  if (body.preferred_kita_type !== undefined) update.preferred_kita_type = body.preferred_kita_type;
  if (body.preferred_languages !== undefined) update.preferred_languages = body.preferred_languages;
  if (body.preferred_hours !== undefined) update.preferred_hours = body.preferred_hours;
  // Extended parent profile
  if (body.job_title !== undefined) update.job_title = body.job_title;
  if (body.employer !== undefined) update.employer = body.employer;
  if (body.work_district !== undefined) update.work_district = body.work_district;
  if (body.work_hours_type !== undefined) update.work_hours_type = body.work_hours_type;
  if (body.work_start_time !== undefined) update.work_start_time = body.work_start_time;
  if (body.work_end_time !== undefined) update.work_end_time = body.work_end_time;
  if (body.family_situation !== undefined) update.family_situation = body.family_situation;
  if (body.home_language !== undefined) update.home_language = body.home_language;
  if (body.additional_languages !== undefined) update.additional_languages = body.additional_languages;
  if (body.max_monthly_fee !== undefined) {
    update.max_monthly_fee = body.max_monthly_fee != null ? Math.max(0, Number(body.max_monthly_fee)) : null;
  }
  if (body.kita_needed_from !== undefined) update.kita_needed_from = body.kita_needed_from;
  // GDPR consent — once set to true, record timestamp
  if (body.ai_consent === true) {
    update.ai_consent = true;
    update.ai_consent_at = new Date().toISOString();
  } else if (body.ai_consent === false) {
    update.ai_consent = false;
    update.ai_consent_at = null;
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
