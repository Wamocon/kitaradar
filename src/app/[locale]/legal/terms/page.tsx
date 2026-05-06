import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "AGB | KitaRadar",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background px-4 py-12 sm:px-6">
        <article className="mx-auto max-w-2xl text-sm text-muted leading-7">
          <h1 className="text-3xl font-bold text-foreground">Allgemeine Geschäftsbedingungen</h1>
          <p className="text-xs text-muted mt-1">Stand: Mai 2026</p>

          <h2 className="mt-8 text-base font-semibold text-foreground">§ 1 Geltungsbereich</h2>
          <p>
            Diese AGB gelten für die Nutzung der webbasierten Plattform KitaRadar
            der WAMOCON GmbH, Mergenthalerallee 79–81, 65760 Eschborn.
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">§ 2 Leistungsbeschreibung</h2>
          <p>
            KitaRadar ermöglicht die Suche nach Kindertagesbetreuungsplätzen auf Basis
            öffentlicher Daten (OpenStreetMap, GovData). Die Plattform übernimmt keine
            Gewähr für die Aktualität oder Vollständigkeit der Daten.
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">§ 3 Nutzungsvoraussetzungen</h2>
          <p>
            Die Nutzung setzt die Registrierung mit einer gültigen E-Mail-Adresse
            voraus. Eine Nutzung durch Minderjährige ohne elterliche Zustimmung ist
            nicht gestattet.
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">§ 4 Free- und Pro-Tarif</h2>
          <p>
            Im Free-Tarif sind 10 Suchanfragen pro Monat enthalten. Der Pro-Tarif
            (7,99 € / Monat) bietet unbegrenzte Suche, KI-Funktionen und
            Bewerbungs-Tracking.
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">§ 5 Kündigung</h2>
          <p>
            Der Pro-Tarif ist monatlich kündbar. Die Kündigung erfolgt im
            Nutzer-Dashboard unter &bdquo;Abonnement&ldquo; ohne Erfordernis einer Kontaktaufnahme
            mit dem Support.
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">§ 6 Community-Feed</h2>
          <p>
            Nutzer, die Beiträge im Community-Feed veröffentlichen, sind für deren
            Inhalt verantwortlich. Falschinformationen, beleidigende oder
            diskriminierende Inhalte können ohne Vorankündigung entfernt werden.
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">§ 7 Haftungsbeschränkung</h2>
          <p>
            KitaRadar haftet nicht für die Richtigkeit von Kita-Daten, nicht
            zugestellte E-Mails oder ausbleibende Rückmeldungen von Einrichtungen.
            Die Plattform stellt lediglich ein Werkzeug zur Unterstützung des
            Suchprozesses dar.
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">§ 8 Anwendbares Recht</h2>
          <p>
            Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist
            Eschborn.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
