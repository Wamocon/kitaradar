import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/de/search"),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("LanguageSwitcher", () => {
  it("renders both locale options (DE and EN)", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText("de")).toBeTruthy();
    expect(screen.getByText("en")).toBeTruthy();
  });

  it("generates correct href for German locale", () => {
    render(<LanguageSwitcher />);
    const deLink = screen.getByText("de").closest("a");
    expect(deLink?.href).toContain("/de/search");
  });

  it("generates correct href for English locale from a DE path", () => {
    render(<LanguageSwitcher />);
    const enLink = screen.getByText("en").closest("a");
    expect(enLink?.href).toContain("/en/search");
  });

  it("renders a divider between locales", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText("|")).toBeTruthy();
  });
});
