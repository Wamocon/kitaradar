import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai, createMaxCompletion, getModel, extractCoTResponse } from "@/lib/openai";
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

  // Parallel: Profil prüfen + Stadt geocodieren
  const [profileResult, geoResult] = await Promise.all([
    supabase.from("profiles").select("subscription_tier").eq("id", user.id).single(),
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      { headers: { "User-Agent": "KitaRadar/1.0 kitaradar@wamocon.com" } }
    )
      .then((r) => r.json() as Promise<Array<{ lat: string; lon: string }>>)
      .catch(() => [] as Array<{ lat: string; lon: string }>),
  ]);

  if (profileResult.data?.subscription_tier !== "pro") {
    return NextResponse.json(
      { error: "KI-Empfehlungen sind nur im Pro-Tarif verfügbar." },
      { status: 403 }
    );
  }

  const lat = geoResult[0] ? parseFloat(geoResult[0].lat) : 50.1109;
  const lng = geoResult[0] ? parseFloat(geoResult[0].lon) : 8.6821;

  // Kitas aus OSM laden (größerer Radius, bis zu 50 Kitas für bessere KI-Auswahl)
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
    .slice(0, 50)
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
    const completion = await createMaxCompletion({
      model: getModel("default"),
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const rawContent = completion.choices[0]?.message?.content ?? "[]";
    const content = extractCoTResponse(rawContent);
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
