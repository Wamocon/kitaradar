import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KitaRadarLogo } from "@/components/ui/KitaRadarLogo";

describe("KitaRadarLogo", () => {
  it("renders an SVG element", () => {
    const { container } = render(<KitaRadarLogo />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("applies the default className when none is provided", () => {
    const { container } = render(<KitaRadarLogo />);
    const svg = container.querySelector("svg")!;
    expect(svg.className).toContain("h-8");
    expect(svg.className).toContain("w-8");
  });

  it("applies a custom className", () => {
    const { container } = render(<KitaRadarLogo className="h-12 w-12 text-red-500" />);
    const svg = container.querySelector("svg")!;
    expect(svg.className).toContain("h-12");
    expect(svg.className).toContain("w-12");
  });

  it("has an accessible aria-label", () => {
    render(<KitaRadarLogo />);
    expect(screen.getByLabelText("KitaRadar Logo")).toBeTruthy();
  });
});
