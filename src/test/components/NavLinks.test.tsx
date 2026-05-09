import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NavLinks } from "@/components/layout/NavLinks";

vi.mock("next/link", () => ({
  default: ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) => (
    <a href={href} onClick={onClick}>{children}</a>
  ),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("NavLinks", () => {
  it("renders the hamburger menu button", () => {
    render(<NavLinks />);
    expect(screen.getByRole("button", { name: /menu/i })).toBeTruthy();
  });

  it("hides the nav links by default", () => {
    render(<NavLinks />);
    expect(screen.queryByText("search")).toBeNull();
  });

  it("opens the menu when the hamburger button is clicked", () => {
    render(<NavLinks />);
    fireEvent.click(screen.getByRole("button", { name: /menu/i }));
    expect(screen.getByText("search")).toBeTruthy();
    expect(screen.getByText("feed")).toBeTruthy();
    expect(screen.getByText("pricing")).toBeTruthy();
  });

  it("closes the menu when a link is clicked", () => {
    render(<NavLinks />);
    fireEvent.click(screen.getByRole("button", { name: /menu/i }));
    fireEvent.click(screen.getByText("search"));
    expect(screen.queryByText("feed")).toBeNull();
  });

  it("closes the menu when the close (X) button is clicked", () => {
    render(<NavLinks />);
    fireEvent.click(screen.getByRole("button", { name: /menu/i }));
    // Now the close button should be present
    fireEvent.click(screen.getByRole("button", { name: /menu/i }));
    expect(screen.queryByText("feed")).toBeNull();
  });
});
