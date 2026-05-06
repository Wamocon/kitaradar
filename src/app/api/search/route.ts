import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { geocodeAddress, searchKitasOverpass } from "@/lib/overpass";
import { createClient } from "@/lib/supabase/server";

const SEARCH_LIMIT_FREE = 10;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body: {
    address: string;
    lat?: number;
    lng?: number;
    radius?: number;
    kitaType?: string;
    ageGroup?: string;
  } = await request.json();

  if (!body.address || typeof body.address !== "string") {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const radiusMeters = Math.min(Math.max((body.radius ?? 5) * 1000, 500), 100000);

  // Free-tier search limit check
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("search_count, tier")
      .eq("id", user.id)
      .single();

    if (profile && profile.tier !== "pro") {
      const count: number = profile.search_count ?? 0;
      if (count >= SEARCH_LIMIT_FREE) {
        return NextResponse.json({ error: "search_limit_reached", count }, { status: 429 });
      }
      await supabase
        .from("profiles")
        .update({ search_count: count + 1 })
        .eq("id", user.id);
    }
  }

  // Use pre-resolved coords from autocomplete selection, or geocode the address
  let coords: { lat: number; lng: number } | null = null;
  if (typeof body.lat === "number" && typeof body.lng === "number") {
    coords = { lat: body.lat, lng: body.lng };
  } else {
    coords = await geocodeAddress(body.address);
  }
  if (!coords) {
    return NextResponse.json({ error: "geocode_failed" }, { status: 422 });
  }

  let kitas = await searchKitasOverpass(coords.lat, coords.lng, radiusMeters);

  // Filter by kitaType if provided
  if (body.kitaType && body.kitaType !== "all") {
    kitas = kitas.filter((k) => k.kitaType === body.kitaType);
  }

  // Sort by distance
  kitas.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  return NextResponse.json({ kitas, center: coords });
}
