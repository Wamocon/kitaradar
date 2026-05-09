import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ osmId: string }>;
}

interface GooglePlace {
  place_id?: string;
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{ photo_reference: string }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    relative_time_description: string;
  }>;
  website?: string;
  formatted_phone_number?: string;
  opening_hours?: { weekday_text?: string[] };
}

interface WikidataResult {
  description?: string;
  wikidataId?: string;
}

const CACHE_HOURS = 72; // Re-fetch after 3 days

async function fetchGooglePlaces(
  name: string,
  lat: number,
  lng: number
): Promise<GooglePlace | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  // Step 1: Find Place to get place_id
  const findUrl = new URL(
    "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
  );
  findUrl.searchParams.set("input", name);
  findUrl.searchParams.set("inputtype", "textquery");
  findUrl.searchParams.set(
    "locationbias",
    `circle:500@${lat},${lng}`
  );
  findUrl.searchParams.set("fields", "place_id");
  findUrl.searchParams.set("key", apiKey);

  const findRes = await fetch(findUrl.toString(), {
    next: { revalidate: 3600 },
  });
  if (!findRes.ok) return null;

  const findData = await findRes.json() as {
    candidates?: Array<{ place_id: string }>;
    status?: string;
  };
  const placeId = findData.candidates?.[0]?.place_id;
  if (!placeId) return null;

  // Step 2: Fetch full Place Details
  const detailUrl = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json"
  );
  detailUrl.searchParams.set("place_id", placeId);
  detailUrl.searchParams.set(
    "fields",
    "place_id,rating,user_ratings_total,photos,reviews,website,formatted_phone_number,opening_hours"
  );
  detailUrl.searchParams.set("language", "de");
  detailUrl.searchParams.set("key", apiKey);

  const detailRes = await fetch(detailUrl.toString(), {
    next: { revalidate: 3600 },
  });
  if (!detailRes.ok) return null;

  const detailData = await detailRes.json() as { result?: GooglePlace };
  if (!detailData.result) return null;

  return { ...detailData.result, place_id: placeId };
}

async function fetchWikidata(
  name: string,
  lat: number,
  lng: number
): Promise<WikidataResult | null> {
  try {
    const query = `
      SELECT ?item ?itemLabel ?desc WHERE {
        ?item wdt:P31 wd:Q78074855 .
        ?item rdfs:label ?itemLabel .
        FILTER(lang(?itemLabel) = "de")
        OPTIONAL { ?item schema:description ?desc . FILTER(lang(?desc) = "de") }
        SERVICE wikibase:around {
          ?item wdt:P625 ?location .
          bd:serviceParam wikibase:center "Point(${lng} ${lat})"^^geo:wktLiteral .
          bd:serviceParam wikibase:radius "1" .
        }
        FILTER(CONTAINS(LCASE(?itemLabel), "${name.toLowerCase().substring(0, 10)}"))
      }
      LIMIT 1
    `;

    const res = await fetch(
      `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`,
      {
        headers: { Accept: "application/json", "User-Agent": "KitaRadar/1.0" },
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) return null;
    const data = await res.json() as {
      results?: { bindings?: Array<{ item?: { value: string }; desc?: { value: string } }> };
    };
    const binding = data.results?.bindings?.[0];
    if (!binding) return null;

    const wikidataId = binding.item?.value?.split("/").pop();
    const description = binding.desc?.value;
    return { wikidataId, description };
  } catch {
    return null;
  }
}

export async function GET(request: Request, { params }: RouteParams) {
  const { osmId } = await params;
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";
  const lat = parseFloat(searchParams.get("lat") ?? "0");
  const lng = parseFloat(searchParams.get("lng") ?? "0");

  if (!osmId || !name || !lat || !lng) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const supabase = await createClient();

  // 1. Check cache
  try {
    const { data: cached } = await supabase
      .from("kita_enrichments")
      .select("*")
      .eq("osm_id", osmId)
      .single();

    if (cached) {
      const ageHours =
        (Date.now() - new Date(cached.enriched_at as string).getTime()) / 3600000;
      if (ageHours < CACHE_HOURS) {
        // Build photo URLs if we have Google Place ID
        const photoUrls = buildPhotoUrls(cached.google_photo_refs as string[] | null);
        return NextResponse.json({ ...cached, photoUrls });
      }
    }
  } catch {
    // Table may not exist yet — continue without cache
  }

  // 2. Fetch from sources in parallel
  const [googleData, wikidataData] = await Promise.allSettled([
    fetchGooglePlaces(name, lat, lng),
    fetchWikidata(name, lat, lng),
  ]);

  const google =
    googleData.status === "fulfilled" ? googleData.value : null;
  const wikidata =
    wikidataData.status === "fulfilled" ? wikidataData.value : null;

  const enrichment = {
    osm_id: osmId,
    name,
    google_place_id: google?.place_id ?? null,
    google_rating: google?.rating ?? null,
    google_ratings_count: google?.user_ratings_total ?? 0,
    google_photo_refs: google?.photos?.slice(0, 5).map((p) => p.photo_reference) ?? [],
    google_reviews: google?.reviews?.slice(0, 5).map((r) => ({
      author: r.author_name,
      rating: r.rating,
      text: r.text,
      time: r.relative_time_description,
    })) ?? [],
    wikidata_id: wikidata?.wikidataId ?? null,
    wikidata_desc: wikidata?.description ?? null,
    website: google?.website ?? null,
    phone: google?.formatted_phone_number ?? null,
    opening_hours: google?.opening_hours?.weekday_text?.join("\n") ?? null,
    enriched_at: new Date().toISOString(),
  };

  // 3. Cache in Supabase (best-effort)
  try {
    await supabase
      .from("kita_enrichments")
      .upsert(enrichment, { onConflict: "osm_id" });
  } catch {
    // Ignore cache errors
  }

  const photoUrls = buildPhotoUrls(enrichment.google_photo_refs);
  return NextResponse.json({ ...enrichment, photoUrls });
}

function buildPhotoUrls(refs: string[] | null): string[] {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || !refs?.length) return [];
  return refs.map(
    (ref) =>
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${apiKey}`
  );
}
