import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { openai, createMaxCompletion, getModel, extractCoTResponse } from "@/lib/openai";
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

  // Anschreiben: reasoning-Modell (qwen3.5:122b) — höchste Qualität, ~92s
  const model = getModel("reasoning");
  let completion;
  try {
    completion = await createMaxCompletion({
      model,
      messages: [
        {
          role: "system",
          content:
            "Du schreibst professionelle, herzliche und individuelle Bewerbungsschreiben für Kita-Plätze. Das Schreiben soll 3-4 Absätze lang sein, die Familie kurz vorstellen, das Interesse an der spezifischen Einrichtung begründen und sich höflich bedanken. Antworte NUR mit dem fertigen Anschreiben (ohne Betreff, ohne Datum, ohne Erklärungen). Antworte auf Deutsch.",
        },
        {
          role: "user",
          content: `Kita: ${body.kitaName}${body.kitaAddress ? ` (${body.kitaAddress})` : ""}\n${childInfo ? `Kind: ${childInfo}` : ""}\n${body.parentNote ? `Zusätzliche Infos der Eltern: ${body.parentNote}` : ""}`,
        },
      ],
      temperature: 0.7,
    });
  } catch (err) {
    console.error("[generate-letter] AI call failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
  }

  const rawContent = completion.choices[0]?.message?.content ?? "";
  console.log("[generate-letter] raw length:", rawContent.length, "| starts with:", rawContent.slice(0, 80));
  const letter = extractCoTResponse(rawContent);
  console.log("[generate-letter] extracted length:", letter.length);

  if (!letter) {
    return NextResponse.json({ error: "ai_empty_response" }, { status: 500 });
  }

  return NextResponse.json({ letter });
}
