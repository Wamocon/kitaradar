import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthBrandingPanel } from "@/components/auth/AuthBrandingPanel";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/KitaRadarLogo", () => ({
  KitaRadarLogo: ({ className }: { className?: string }) => (
    <svg aria-label="KitaRadar Logo" className={className} />
  ),
}));

describe("AuthBrandingPanel", () => {
  it("renders the KitaRadar brand name", () => {
    render(<AuthBrandingPanel />);
    expect(screen.getByText("KitaRadar")).toBeTruthy();
  });

  it("renders the tagline translation key", () => {
    render(<AuthBrandingPanel />);
    expect(screen.getByText("tagline")).toBeTruthy();
  });

  it("renders the headline lines", () => {
    render(<AuthBrandingPanel />);
    // headline_line1 and headline_line2 are siblings inside an h2 separated by <br/>
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.textContent).toContain("headline_line1");
    expect(heading.textContent).toContain("headline_line2");
  });

  it("renders all 4 feature keys", () => {
    render(<AuthBrandingPanel />);
    expect(screen.getByText("feature_map")).toBeTruthy();
    expect(screen.getByText("feature_ai")).toBeTruthy();
    expect(screen.getByText("feature_apply")).toBeTruthy();
    expect(screen.getByText("feature_track")).toBeTruthy();
  });

  it("renders the trust line", () => {
    render(<AuthBrandingPanel />);
    expect(screen.getByText("trust_line")).toBeTruthy();
  });

  it("renders the logo SVG", () => {
    const { container } = render(<AuthBrandingPanel />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
