import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";
import type { OverpassKita } from "@/lib/overpass";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!openai) {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
  }

  const body: { kitas: OverpassKita[]; preferences: string } = await request.json();

  if (!body.kitas?.length || !body.preferences) {
    return NextResponse.json({ error: "kitas and preferences required" }, { status: 400 });
  }

  const kitaList = body.kitas
    .slice(0, 20)
    .map(
      (k, i) =>
        `${i + 1}. ${k.name} (${k.kitaType}, ${k.distanceKm ?? "?"}km entfernt, ${k.address} ${k.city})`
    )
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Du bist ein hilfreicher Assistent für Eltern, die einen Kita-Platz suchen. Ranke die Kitas nach den angegebenen Präferenzen der Eltern. Antworte mit einer sortierten nummerierten Liste (max 5) und einer kurzen Begründung (1 Satz) pro Kita. Antworte auf Deutsch.",
      },
      {
        role: "user",
        content: `Meine Präferenzen: ${body.preferences}\n\nVerfügbare Kitas:\n${kitaList}`,
      },
    ],
    max_tokens: 600,
    temperature: 0.5,
  });

  const text = completion.choices[0]?.message?.content ?? "";
  return NextResponse.json({ ranking: text });
}
