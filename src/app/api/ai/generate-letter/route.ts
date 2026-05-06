import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { openai } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!openai) {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
  }

  const body: {
    kitaName: string;
    kitaAddress?: string;
    childName?: string;
    childAge?: string;
    childNeeds?: string;
    parentNote?: string;
  } = await request.json();

  if (!body.kitaName) {
    return NextResponse.json({ error: "kitaName required" }, { status: 400 });
  }

  const childInfo = [
    body.childName ? `Name des Kindes: ${body.childName}` : null,
    body.childAge ? `Alter: ${body.childAge} Monate` : null,
    body.childNeeds ? `Besonderheiten/Bedürfnisse: ${body.childNeeds}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Du schreibst professionelle, herzliche und individuelle Bewerbungsschreiben für Kita-Plätze. Das Schreiben soll 3-4 Absätze lang sein, die Familie kurz vorstellen, das Interesse an der spezifischen Einrichtung begründen und sich höflich bedanken. Antworte nur mit dem Anschreiben (ohne Betreff, ohne Datum). Antworte auf Deutsch.",
      },
      {
        role: "user",
        content: `Kita: ${body.kitaName}${body.kitaAddress ? ` (${body.kitaAddress})` : ""}\n${childInfo ? `Kind: ${childInfo}` : ""}\n${body.parentNote ? `Zusätzliche Infos der Eltern: ${body.parentNote}` : ""}`,
      },
    ],
    max_tokens: 600,
    temperature: 0.7,
  });

  const letter = completion.choices[0]?.message?.content ?? "";
  return NextResponse.json({ letter });
}
