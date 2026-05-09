import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai, getModel } from "@/lib/openai";
import { searchKitasOverpass } from "@/lib/overpass";

interface RequestBody {
  city: string;
  child?: {
    name: string;
    birth_year: number | null;
    birth_month: number | null;
    special_needs: string | null;
  } | null;
  preferences?: {
    pedagogy?: string | null;
    kitaType?: string | null;
    languages?: string | null;
    hours?: string | null;
  };
  radius?: number;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  // Check Pro subscription
  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_tier !== "pro") {
    return NextResponse.json(
      { error: "KI-Empfehlungen sind nur im Pro-Tarif verfügbar." },
      { status: 403 }
    );
  }

  if (!openai) {
    return NextResponse.json(
      { error: "KI-Service nicht verfügbar. Bitte MAX_AI_BASE_URL konfigurieren." },
      { status: 503 }
    );
  }

  const body: RequestBody = await request.json();
  const { city, child, preferences, radius = 5 } = body;

  if (!city?.trim()) {
    return NextResponse.json({ error: "Suchort fehlt." }, { status: 400 });
  }

  // Geocode city to lat/lng via Nominatim
  let lat = 50.1109;
  let lng = 8.6821; // Frankfurt fallback
  try {
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { "User-Agent": "KitaRadar/1.0 kitaradar@wamocon.com" } }
    );
    const geoData = await geoRes.json() as Array<{ lat: string; lon: string }>;
    if (geoData[0]) {
      lat = parseFloat(geoData[0].lat);
      lng = parseFloat(geoData[0].lon);
    }
  } catch {
    // Use fallback
  }

  // Fetch nearby kitas from OSM
  let kitas: Awaited<ReturnType<typeof searchKitasOverpass>> = [];
  try {
    kitas = await searchKitasOverpass(lat, lng, radius * 1000);
  } catch {
    kitas = [];
  }

  if (kitas.length === 0) {
    return NextResponse.json({
      recommendations: [],
    });
  }

  // Build age description
  let ageDesc = "Alter unbekannt";
  if (child?.birth_year) {
    const months =
      (new Date().getFullYear() - child.birth_year) * 12 +
      new Date().getMonth() -
      (child.birth_month ?? 1) +
      1;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    ageDesc = years > 0 ? `${years} Jahre${rem > 0 ? ` ${rem} Monate` : ""}` : `${months} Monate`;
  }

  const kitaList = kitas
    .slice(0, 20)
    .map(
      (k, i) =>
        `${i + 1}. ${k.name} | Träger: ${k.kitaType} | Adresse: ${k.address ?? "unbekannt"} | Kapazität: ${k.capacity ?? "?"} | Öffnungszeiten: ${k.openingHours ?? "?"} | Konfession: ${k.religion ?? "keine"} | Barrierefrei: ${k.wheelchair ? "ja" : "nein"}`
    )
    .join("\n");

  const prompt = `Du bist ein Experte für Kinderbetreuung in Deutschland. Analysiere die folgenden Kitas und erstelle personalisierte Empfehlungen.

Kind: ${child?.name ?? "Unbekannt"}, Alter: ${ageDesc}${child?.special_needs ? `, Besondere Bedürfnisse: ${child.special_needs}` : ""}

Eltern-Präferenzen:
- Pädagogik: ${preferences?.pedagogy ?? "keine Präferenz"}
- Träger-Typ: ${preferences?.kitaType ?? "keine Präferenz"}
- Sprachen: ${preferences?.languages ?? "keine Präferenz"}
- Betreuungszeit: ${preferences?.hours ?? "keine Präferenz"}

Verfügbare Kitas in ${city} (${radius} km Radius):
${kitaList}

Erstelle die TOP 5 passendsten Kitas als JSON-Array. Jedes Objekt hat exakt diese Felder:
{
  "name": "Kita-Name",
  "address": "Adresse",
  "kitaType": "public|church|private|free",
  "distance": "~X km",
  "matchScore": 0-100,
  "reasons": ["Grund 1", "Grund 2", "Grund 3"],
  "strengths": ["Stärke 1", "Stärke 2"],
  "considerations": ["Hinweis falls relevant"]
}

Antworte NUR mit dem JSON-Array, keine weiteren Texte.`;

  try {
    const completion = await openai.chat.completions.create({
      model: getModel("default"),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content ?? "[]";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error("AI recommendations error:", err);
    return NextResponse.json(
      { error: "KI-Anfrage fehlgeschlagen. Bitte versuchen Sie es später erneut." },
      { status: 500 }
    );
  }
}
