import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataPrivacyConsentDialog } from "@/components/profile/DataPrivacyConsentDialog";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe("DataPrivacyConsentDialog — extended_profile context", () => {
  it("renders the dialog title", () => {
    render(
      <DataPrivacyConsentDialog
        context="extended_profile"
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    expect(screen.getByText("Datenschutz-Einwilligung")).toBeTruthy();
  });

  it("renders the extended_profile subtitle", () => {
    render(
      <DataPrivacyConsentDialog
        context="extended_profile"
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    expect(screen.getByText("Erweiterte Eltern- und Familiendaten")).toBeTruthy();
  });

  it("renders the intro text", () => {
    render(
      <DataPrivacyConsentDialog
        context="extended_profile"
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    expect(screen.getByText(/erweiterte persönliche/i)).toBeTruthy();
  });

  it("renders data points list items", () => {
    render(
      <DataPrivacyConsentDialog
        context="extended_profile"
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    expect(screen.getByText(/Berufliche Informationen/)).toBeTruthy();
    expect(screen.getByText(/Familiensituation/)).toBeTruthy();
  });

  it("renders the Datenschutzerklärung link", () => {
    render(
      <DataPrivacyConsentDialog
        context="extended_profile"
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    const link = screen.getByRole("link", { name: /Datenschutzerklärung/i });
    expect(link.getAttribute("href")).toBe("/legal/privacy");
  });

  it("calls onAccept when 'Einwilligen & speichern' is clicked", () => {
    const onAccept = vi.fn();
    render(
      <DataPrivacyConsentDialog
        context="extended_profile"
        onAccept={onAccept}
        onDecline={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Einwilligen & speichern"));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("calls onDecline when 'Ablehnen' is clicked", () => {
    const onDecline = vi.fn();
    render(
      <DataPrivacyConsentDialog
        context="extended_profile"
        onAccept={vi.fn()}
        onDecline={onDecline}
      />
    );
    fireEvent.click(screen.getByText("Ablehnen"));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it("calls onDecline when the X button is clicked", () => {
    const onDecline = vi.fn();
    render(
      <DataPrivacyConsentDialog
        context="extended_profile"
        onAccept={vi.fn()}
        onDecline={onDecline}
      />
    );
    fireEvent.click(screen.getByLabelText("Abbrechen"));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it("renders WAMOCON GmbH footer text", () => {
    render(
      <DataPrivacyConsentDialog
        context="extended_profile"
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    expect(screen.getByText(/WAMOCON GmbH/)).toBeTruthy();
  });
});

describe("DataPrivacyConsentDialog — ai_preferences context", () => {
  it("renders the ai_preferences subtitle", () => {
    render(
      <DataPrivacyConsentDialog
        context="ai_preferences"
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    expect(screen.getByText("KI-gestützte Datenverarbeitung")).toBeTruthy();
  });

  it("renders ai_preferences data points", () => {
    render(
      <DataPrivacyConsentDialog
        context="ai_preferences"
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    expect(screen.getByText(/Pädagogische Präferenzen/)).toBeTruthy();
  });

  it("renders the purpose points for ai_preferences", () => {
    render(
      <DataPrivacyConsentDialog
        context="ai_preferences"
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />
    );
    expect(screen.getByText(/personalisierter Kita-Empfehlungen/i)).toBeTruthy();
  });
});
