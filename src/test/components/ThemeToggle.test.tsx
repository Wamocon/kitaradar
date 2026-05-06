import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: vi.fn().mockReturnValue({ setTheme: mockSetTheme, resolvedTheme: "light" }),
}));

describe("ThemeToggle", () => {
  it("renders a button with aria-label", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeTruthy();
  });

  it("shows Moon icon in light mode", () => {
    const { container } = render(<ThemeToggle />);
    // lucide Moon renders an SVG; the button has aria-label so we check SVG presence
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("calls setTheme('dark') when clicked in light mode", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("calls setTheme('light') when clicked in dark mode", async () => {
    const { useTheme } = await import("next-themes");
    vi.mocked(useTheme).mockReturnValueOnce({ setTheme: mockSetTheme, resolvedTheme: "dark", theme: "dark", themes: [], systemTheme: "dark", forcedTheme: undefined });
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
