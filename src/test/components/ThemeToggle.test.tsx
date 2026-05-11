import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

// Single hoisted mock — resolvedTheme controlled via a mutable variable
const mockSetTheme = vi.fn();
let mockResolvedTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    resolvedTheme: mockResolvedTheme,
    theme: mockResolvedTheme,
    themes: [],
    systemTheme: mockResolvedTheme,
    forcedTheme: undefined,
  }),
}));

describe("ThemeToggle (light mode)", () => {
  beforeEach(() => {
    mockResolvedTheme = "light";
    mockSetTheme.mockClear();
  });

  it("renders a button with aria-label", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeTruthy();
  });

  it("shows SVG icon in light mode", () => {
    const { container } = render(<ThemeToggle />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("calls setTheme('dark') when clicked in light mode", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("renders correctly (smoke test)", () => {
    const { container } = render(<ThemeToggle />);
    expect(container.querySelector("button")).toBeTruthy();
  });
});

describe("ThemeToggle (dark mode)", () => {
  beforeEach(() => {
    mockResolvedTheme = "dark";
    mockSetTheme.mockClear();
  });

  afterEach(() => {
    mockResolvedTheme = "light";
  });

  it("calls setTheme('light') when clicked in dark mode", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("shows SVG icon in dark mode", () => {
    const { container } = render(<ThemeToggle />);
    expect(container.querySelector("svg")).toBeTruthy();
  });
});

