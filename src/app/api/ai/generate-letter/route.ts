import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { openai, createMaxCompletion, getModel, extractCoTResponse } from "@/lib/openai";
import { createClient } from "@/lib/supabase/server";

const FAMILY_LABELS: Record<string, string> = {
  two_parent:     "Zweielternfamilie",
  single_parent:  "Alleinerziehend",
  shared_custody: "Getrennt lebend / Wechselmodell",
  patchwork:      "Patchworkfamilie",
  grandparent:    "Großelternfamilie",
};

const PEDAGOGY_LABELS: Record<string, string> = {
  montessori: "Montessori",
  waldorf:    "Waldorf",
  reggio:     "Reggio-Pädagogik",
  bilingual:  "Bilingual",
  religious:  "Religiös-konfessionell",
  standard:   "Regelpädagogik",
};

const HOURS_LABELS: Record<string, string> = {
  half_day:  "Halbtags (bis 13 Uhr)",
  full_day:  "Ganztags (bis 17 Uhr)",
  extended:  "Erweitert (bis 19 Uhr)",
  flexible:  "Flexibel",
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!openai) {
    return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
  }

  const body: { kitaName: string; kitaAddress?: string; parentNote?: string } = await request.json();

  if (!body.kitaName) {
    return NextResponse.json({ error: "kitaName required" }, { status: 400 });
  }

  // ─── Profil + Kinder aus der Datenbank laden ───────────────────────────────────
  const [{ data: profile }, { data: children }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, partner_name, role, family_situation, home_language, additional_languages, " +
        "job_title, employer, work_district, work_hours_type, work_start_time, work_end_time, " +
        "preferred_pedagogy, preferred_kita_type, preferred_hours, max_monthly_fee, kita_needed_from, ai_consent"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("children")
      .select("name, birth_year, birth_month, special_needs")
      .eq("profile_id", user.id)
      .order("created_at"),
  ]);

  // ─── Kontext-Abschnitte für den KI-Prompt zusammenstellen ───────────────────
  const now = new Date();
  const lines: string[] = [];

  // Familie
  if (profile?.full_name)     lines.push(`Name der Eltern / Antragsteller: ${profile.full_name}${profile.partner_name ? ` und ${profile.partner_name}` : ""}`);
  if (profile?.family_situation) lines.push(`Familiensituation: ${FAMILY_LABELS[profile.family_situation] ?? profile.family_situation}`);
  if (profile?.home_language)    lines.push(`Familiensprache: ${profile.home_language}${profile.additional_languages ? `, weitere: ${profile.additional_languages}` : ""}`);

  // Kinder
  if (children && children.length > 0) {
    for (const c of children) {
      let ageInfo = "";
      if (c.birth_year && c.birth_month) {
        const dob = new Date(c.birth_year, c.birth_month - 1, 1);
        const months = (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
        ageInfo = months < 24 ? `${months} Monate alt` : `${Math.floor(months / 12)} Jahre alt`;
      }
      const parts = [c.name, ageInfo, c.special_needs ? `besondere Bedürfnisse: ${c.special_needs}` : null].filter(Boolean);
      lines.push(`Kind: ${parts.join(", ")}`);
    }
  }

  // Betreuungswunsch
  if (profile?.kita_needed_from)  lines.push(`Gewünschter Betreuungsbeginn: ${new Date(profile.kita_needed_from).toLocaleDateString("de-DE", { year: "numeric", month: "long" })}`);
  if (profile?.preferred_hours)   lines.push(`Gewünschte Betreuungszeit: ${HOURS_LABELS[profile.preferred_hours] ?? profile.preferred_hours}`);
  if (profile?.preferred_pedagogy) lines.push(`Pädagogischer Ansatz bevorzugt: ${PEDAGOGY_LABELS[profile.preferred_pedagogy] ?? profile.preferred_pedagogy}`);
  if (profile?.preferred_languages) lines.push(`Bevorzugte Kita-Sprache(n): ${profile.preferred_languages}`);
  if (profile?.max_monthly_fee)   lines.push(`Max. monatlicher Beitrag: ${profile.max_monthly_fee} €`);

  // Beruf
  if (profile?.job_title || profile?.employer) {
    const job = [profile.job_title, profile.employer && `bei ${profile.employer}`, profile.work_district && `im Bereich ${profile.work_district}`].filter(Boolean).join(", ");
    lines.push(`Beruf: ${job}`);
  }
  if (profile?.work_hours_type === "full_time" || profile?.work_hours_type === "shift") {
    const times = [profile.work_start_time, profile.work_end_time].filter(Boolean).join(" – ");
    lines.push(`Arbeitszeiten: ${times || profile.work_hours_type}`);
  }

  if (body.parentNote) lines.push(`Persönliche Anmerkungen der Eltern: ${body.parentNote}`);

  const contextBlock = lines.length > 0 ? lines.join("\n") : "Keine Profildaten vorhanden.";

  // ─── KI-Aufruf ────────────────────────────────────────────────────
  const model = getModel("reasoning");
  let completion;
  try {
    completion = await createMaxCompletion({
      model,
      messages: [
        {
          role: "system",
          content:
            "Du bist ein Experte für das Verfassen professioneller, herzlicher und individueller Bewerbungsschreiben für Kita-Plätze in Deutschland.\n" +
            "Erstelle ein ausführliches, überzeugendes Anschreiben mit 5–6 Absätzen.\n" +
            "Struktur:\n" +
            "1. Anrede und persönliche Vorstellung der Familie (Name, Familiensituation, Sprachen)\n" +
            "2. Vorstellung des Kindes / der Kinder (Name, Alter, Persönlichkeit, besondere Bedürfnisse falls vorhanden)\n" +
            "3. Begründung, warum genau diese Einrichtung gewählt wurde (Name und Pädagogik nennen)\n" +
            "4. Betreuungsbedarf: Beginn, Umfang und ggf. berufliche Situation der Eltern\n" +
            "5. Persönliche Werte und Erwartungen an die Kita (Einbeziehung des bevorzugten pädagogischen Ansatzes)\n" +
            "6. Freundliche Verabschiedung: Bitte um Gespräch/Rückmeldung, gefolgt von einer Leerzeile, dann 'Mit freundlichen Grüßen' und darunter den vollen Namen(n) der Eltern sowie den Namen des Kindes / der Kinder (z.B. 'Familie Müller\nAnna Müller und Thomas Müller\nmit Tochter Lena (3 Jahre)').\n" +
            "Stil: warmherzig, authentisch, konkret — keine Floskeln. Reale Details aus dem Profil einarbeiten.\n" +
            "Antworte NUR mit dem fertigen Anschreiben (ohne Betreff, ohne Datum, ohne Erklärungen). Sprache: Deutsch.",
        },
        {
          role: "user",
          content: `Kita: ${body.kitaName}${body.kitaAddress ? ` (${body.kitaAddress})` : ""}\n\nFamilien- und Profildaten:\n${contextBlock}`,
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
