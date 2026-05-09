import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Impressum – KitaRadar",
  description: "Impressum der KitaRadar Plattform der WAMOCON GmbH.",
};

export default function ImprintPage() {
  return (
    <LegalPageShell title="Impressum" updatedAt="Mai 2026">
      <LegalSection title="Anbieter">
        <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-base">WAMOCON GmbH</p>
        <p>
          Mergenthalerallee 79–81<br />
          65760 Eschborn<br />
          Deutschland
        </p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>
          Telefon:{" "}
          <a href="tel:+4961965838311" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
            +49 6196 5838311
          </a>
        </p>
        <p>
          E-Mail (allgemein):{" "}
          <a href="mailto:info@wamocon.com" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
            info@wamocon.com
          </a>
        </p>
        <p>
          E-Mail (KitaRadar):{" "}
          <a href="mailto:kitaradar@wamocon.com" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
            kitaradar@wamocon.com
          </a>
        </p>
      </LegalSection>

      <LegalSection title="Vertretungsberechtigter Geschäftsführer">
        <p>Dipl.-Ing. Waleri Moretz</p>
      </LegalSection>

      <LegalSection title="Registereintrag">
        <p>Sitz der Gesellschaft: Eschborn</p>
        <p>Handelsregister: Eschborn HRB 123666</p>
        <p>Umsatzsteuer-Identifikationsnummer: DE344930486</p>
      </LegalSection>

      <LegalSection title="Angaben zum Angebot">
        <p>
          KitaRadar ist eine webbasierte Software-as-a-Service-Plattform (SaaS) für die
          KI-gestützte Suche nach freien Kindertagesbetreuungsplätzen in Deutschland.
          Das Angebot richtet sich an Eltern und Erziehungsberechtigte.
        </p>
      </LegalSection>

      <LegalSection title="Haftungsausschluss">
        <p>
          <strong className="text-zinc-800 dark:text-zinc-200">Haftung für Inhalte:</strong>{" "}
          Die auf KitaRadar angezeigten Kita-Daten stammen aus OpenStreetMap und weiteren öffentlichen
          Quellen und können veraltet oder unvollständig sein. WAMOCON GmbH übernimmt keine Haftung
          für Richtigkeit und Vollständigkeit.
        </p>
        <p>
          <strong className="text-zinc-800 dark:text-zinc-200">Haftung für Links:</strong>{" "}
          Für die Inhalte verlinkter externer Seiten ist stets der jeweilige Anbieter verantwortlich.
        </p>
      </LegalSection>

      <LegalSection title="Urheberrecht">
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
          unterliegen dem deutschen Urheberrecht. Vervielfältigung und Verbreitung bedürfen
          der schriftlichen Zustimmung des jeweiligen Autors.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
