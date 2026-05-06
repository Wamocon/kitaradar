import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | KitaRadar",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-background px-4 py-12 sm:px-6">
        <article className="mx-auto max-w-2xl text-sm text-muted leading-7">
          <h1 className="text-3xl font-bold text-foreground">Datenschutzerklärung</h1>
          <p className="text-xs text-muted mt-1">Stand: Mai 2026</p>

          <h2 className="mt-8 text-base font-semibold text-foreground">1. Verantwortlicher</h2>
          <p>
            WAMOCON GmbH, Mergenthalerallee 79–81, 65760 Eschborn.<br />
            E-Mail: <a href="mailto:info@wamocon.com" className="text-primary hover:underline">info@wamocon.com</a>
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">2. Datenverarbeitung</h2>
          <p>
            Wir verarbeiten folgende personenbezogenen Daten: Name, E-Mail-Adresse,
            Kinderdaten (optional), Standortdaten für die Umkreissuche sowie
            Nutzungsdaten der Plattform.
          </p>
          <p className="mt-2">
            Rechtsgrundlage für die Verarbeitung ist Art. 6 Abs. 1 lit. b DSGVO
            (Vertragserfüllung) und Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">3. Hosting und Datenbank</h2>
          <p>
            Die Anwendung wird auf Vercel (Vercel Inc., USA) gehostet.
            Die Datenbank wird auf Supabase (EU-Region Frankfurt) betrieben.
            Es gelten die jeweiligen Datenschutzbestimmungen dieser Anbieter.
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">4. KI-Funktionen</h2>
          <p>
            Für KI-gestützte Funktionen (Suchassistent, Bewerbungsgenerator) werden
            Eingaben an die OpenAI API (EU-kompatible Verarbeitung) übertragen.
            Es werden keine personenbezogenen Kinderdaten an OpenAI übermittelt.
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">5. E-Mail-Versand</h2>
          <p>
            Der Bewerbungsversand erfolgt ausschließlich über den E-Mail-Client des
            Nutzers (mailto-Link). KitaRadar sendet keine E-Mails in eigenem Namen.
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">6. Zahlungsabwicklung</h2>
          <p>
            Zahlungen werden über Stripe (Stripe Inc.) abgewickelt.
            Kreditkartendaten werden von KitaRadar nicht gespeichert.
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">7. Ihre Rechte</h2>
          <p>
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung
            der Verarbeitung, Datenübertragbarkeit und Widerspruch. Zur Ausübung Ihrer
            Rechte wenden Sie sich an:{" "}
            <a href="mailto:info@wamocon.com" className="text-primary hover:underline">info@wamocon.com</a>
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">8. Datenlöschung</h2>
          <p>
            Sie können Ihr Konto und alle gespeicherten Daten jederzeit in den
            Profileinstellungen selbst löschen.
          </p>

          <h2 className="mt-6 text-base font-semibold text-foreground">
            9. Beschwerderecht
          </h2>
          <p>
            Bei Beschwerden können Sie sich an den Hessischen Beauftragten für
            Datenschutz und Informationsfreiheit wenden.
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
