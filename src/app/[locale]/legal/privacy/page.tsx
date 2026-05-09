import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Datenschutzerklärung – KitaRadar",
  description: "Datenschutzerklärung der KitaRadar Plattform der WAMOCON GmbH.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Datenschutzerklärung" updatedAt="Mai 2026">
      <LegalSection title="1. Verantwortlicher">
        <p>
          WAMOCON GmbH, Mergenthalerallee 79–81, 65760 Eschborn.
        </p>
        <p>
          E-Mail:{" "}
          <a href="mailto:info@wamocon.com" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
            info@wamocon.com
          </a>
        </p>
      </LegalSection>

      <LegalSection title="2. Verarbeitete Daten">
        <p>
          Wir verarbeiten folgende personenbezogene Daten: Name, E-Mail-Adresse,
          Kinderdaten (optional), Standortdaten für die Umkreissuche sowie
          Nutzungsdaten der Plattform.
        </p>
        <p>
          Rechtsgrundlage für die Verarbeitung ist Art. 6 Abs. 1 lit. b DSGVO
          (Vertragserfüllung) und Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
        </p>
      </LegalSection>

      <LegalSection title="3. Hosting und Datenbank">
        <p>
          Die Anwendung wird auf Vercel (Vercel Inc., USA) gehostet.
          Die Datenbank wird auf Supabase (EU-Region Frankfurt) betrieben.
          Es gelten die jeweiligen Datenschutzbestimmungen dieser Anbieter.
        </p>
      </LegalSection>

      <LegalSection title="4. KI-Funktionen">
        <p>
          Für KI-gestützte Funktionen (Suchassistent, Bewerbungsgenerator) werden
          Eingaben verarbeitet. Es werden keine personenbezogenen Kinderdaten an
          externe KI-Dienste übermittelt.
        </p>
      </LegalSection>

      <LegalSection title="5. E-Mail-Versand">
        <p>
          Der Bewerbungsversand erfolgt ausschließlich über den E-Mail-Client des
          Nutzers (mailto-Link). KitaRadar sendet keine E-Mails in eigenem Namen.
        </p>
      </LegalSection>

      <LegalSection title="6. Zahlungsabwicklung">
        <p>
          Zahlungen werden über Stripe (Stripe Inc.) abgewickelt.
          Kreditkartendaten werden von KitaRadar nicht gespeichert.
        </p>
      </LegalSection>

      <LegalSection title="7. Ihre Rechte">
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung
          der Verarbeitung, Datenübertragbarkeit und Widerspruch. Zur Ausübung Ihrer
          Rechte wenden Sie sich an:{" "}
          <a href="mailto:info@wamocon.com" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
            info@wamocon.com
          </a>
        </p>
      </LegalSection>

      <LegalSection title="8. Datenlöschung">
        <p>
          Sie können Ihr Konto und alle gespeicherten Daten jederzeit in den
          Profileinstellungen selbst löschen.
        </p>
      </LegalSection>

      <LegalSection title="9. Beschwerderecht">
        <p>
          Bei Beschwerden können Sie sich an den Hessischen Beauftragten für
          Datenschutz und Informationsfreiheit wenden.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
