import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock("@/components/ui/KitaRadarLogo", () => ({
  KitaRadarLogo: ({ className }: { className?: string }) => (
    <svg aria-label="KitaRadar Logo" className={className} />
  ),
}));

describe("LegalPageShell", () => {
  it("renders the page title", () => {
    render(<LegalPageShell title="Impressum">content</LegalPageShell>);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeTruthy();
    expect(h1.textContent).toBe("Impressum");
  });

  it("renders the default updatedAt date", () => {
    render(<LegalPageShell title="AGB">content</LegalPageShell>);
    expect(screen.getByText(/Mai 2026/)).toBeTruthy();
  });

  it("renders a custom updatedAt date", () => {
    render(<LegalPageShell title="AGB" updatedAt="April 2025">content</LegalPageShell>);
    expect(screen.getByText(/April 2025/)).toBeTruthy();
  });

  it("renders children content", () => {
    render(<LegalPageShell title="Datenschutz"><p>Datenschutztext</p></LegalPageShell>);
    expect(screen.getByText("Datenschutztext")).toBeTruthy();
  });

  it("renders navigation links in header", () => {
    render(<LegalPageShell title="Test">content</LegalPageShell>);
    const links = screen.getAllByRole("link");
    const hrefs = links.map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/legal/imprint");
    expect(hrefs).toContain("/legal/privacy");
    expect(hrefs).toContain("/legal/terms");
  });

  it("renders the KitaRadar home link", () => {
    render(<LegalPageShell title="Test">content</LegalPageShell>);
    const homeLinks = screen.getAllByRole("link").filter((l) => l.getAttribute("href") === "/");
    expect(homeLinks.length).toBeGreaterThan(0);
  });

  it("renders the breadcrumb with title", () => {
    render(<LegalPageShell title="Impressum">content</LegalPageShell>);
    // h1 heading contains the title
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.textContent).toBe("Impressum");
  });

  it("renders the WAMOCON GmbH copyright footer", () => {
    render(<LegalPageShell title="Test">content</LegalPageShell>);
    expect(screen.getByText(/WAMOCON GmbH/)).toBeTruthy();
  });
});

describe("LegalSection", () => {
  it("renders the section title", () => {
    render(<LegalSection title="§ 1 Geltungsbereich">Text</LegalSection>);
    expect(screen.getByText("§ 1 Geltungsbereich")).toBeTruthy();
  });

  it("renders children content", () => {
    render(<LegalSection title="§ 2"><p>Paragraph text</p></LegalSection>);
    expect(screen.getByText("Paragraph text")).toBeTruthy();
  });
});
