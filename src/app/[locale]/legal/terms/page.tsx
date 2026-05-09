import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "AGB – KitaRadar",
  description: "Allgemeine Geschäftsbedingungen der KitaRadar Plattform der WAMOCON GmbH.",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Allgemeine Geschäftsbedingungen" updatedAt="Mai 2026">
      <LegalSection title="§ 1 Geltungsbereich">
        <p>
          Diese AGB gelten für die Nutzung der webbasierten Plattform KitaRadar
          der WAMOCON GmbH, Mergenthalerallee 79–81, 65760 Eschborn.
        </p>
      </LegalSection>

      <LegalSection title="§ 2 Leistungsbeschreibung">
        <p>
          KitaRadar ermöglicht die Suche nach Kindertagesbetreuungsplätzen auf Basis
          öffentlicher Daten (OpenStreetMap, GovData). Die Plattform übernimmt keine
          Gewähr für die Aktualität oder Vollständigkeit der Daten.
        </p>
      </LegalSection>

      <LegalSection title="§ 3 Nutzungsvoraussetzungen">
        <p>
          Die Nutzung setzt die Registrierung mit einer gültigen E-Mail-Adresse
          voraus. Eine Nutzung durch Minderjährige ohne elterliche Zustimmung ist
          nicht gestattet.
        </p>
      </LegalSection>

      <LegalSection title="§ 4 Free- und Pro-Tarif">
        <p>
          Im Free-Tarif sind 10 Suchanfragen pro Monat enthalten. Der Pro-Tarif
          (7,99 € / Monat) bietet unbegrenzte Suche, KI-Funktionen und
          Bewerbungs-Tracking.
        </p>
      </LegalSection>

      <LegalSection title="§ 5 Kündigung">
        <p>
          Der Pro-Tarif ist monatlich kündbar. Die Kündigung erfolgt im
          Nutzer-Dashboard unter „Abonnement“ ohne Erfordernis einer Kontaktaufnahme
          mit dem Support.
        </p>
      </LegalSection>

      <LegalSection title="§ 6 Community-Feed">
        <p>
          Nutzer, die Beiträge im Community-Feed veröffentlichen, sind für deren
          Inhalt verantwortlich. Falschinformationen, beleidigende oder
          diskriminierende Inhalte können ohne Vorankündigung entfernt werden.
        </p>
      </LegalSection>

      <LegalSection title="§ 7 Haftungsbeschränkung">
        <p>
          KitaRadar haftet nicht für die Richtigkeit von Kita-Daten, nicht
          zugestellte E-Mails oder ausbleibende Rückmeldungen von Einrichtungen.
          Die Plattform stellt lediglich ein Werkzeug zur Unterstützung des
          Suchprozesses dar.
        </p>
      </LegalSection>

      <LegalSection title="§ 8 Anwendbares Recht">
        <p>
          Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Eschborn.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
