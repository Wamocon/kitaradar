import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Impressum | KitaRadar",
};

export default function ImprintPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background px-4 py-12 sm:px-6">
        <article className="mx-auto max-w-2xl prose prose-sm dark:prose-invert">
          <h1 className="text-3xl font-bold text-foreground">Impressum</h1>
          <p className="text-xs text-muted">Stand: Mai 2026</p>

          <h2 className="mt-8 text-lg font-semibold text-foreground">WAMOCON GmbH</h2>
          <address className="not-italic text-sm text-muted leading-6">
            Mergenthalerallee 79–81<br />
            65760 Eschborn<br />
            Deutschland
          </address>

          <h2 className="mt-6 text-base font-semibold text-foreground">Kontakt</h2>
          <p className="text-sm text-muted">
            Telefon: +49 6196 5838311<br />
            E-Mail: <a href="mailto:info@wamocon.com" className="text-primary hover:underline">info@wamocon.com</a><br />
            Projektkontakt: <a href="mailto:kitaradar@wamocon.com" className="text-primary hover:underline">kitaradar@wamocon.com</a>
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">
            Vertretungsberechtigter Geschäftsführer
          </h2>
          <p className="text-sm text-muted">Dipl.-Ing. Waleri Moretz</p>

          <h2 className="mt-6 text-base font-semibold text-foreground">Registereintrag</h2>
          <p className="text-sm text-muted">
            Sitz der Gesellschaft: Eschborn<br />
            Handelsregister: Eschborn HRB 123666<br />
            Umsatzsteuer-Identifikationsnummer: DE344930486
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">
            Angaben zum Angebot
          </h2>
          <p className="text-sm text-muted">
            KitaRadar ist eine webbasierte Software-as-a-Service-Plattform für die
            Suche nach freien Kindertagesbetreuungsplätzen in Deutschland. Das Angebot
            richtet sich an Eltern und Erziehungsberechtigte.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
