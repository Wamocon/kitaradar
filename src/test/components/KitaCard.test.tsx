import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { KitaCard } from "@/components/search/KitaCard";
import type { OverpassKita } from "@/lib/overpass";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}(${JSON.stringify(params)})` : key,
}));

const baseKita: OverpassKita = {
  id: "osm-1",
  name: "Kita Sonnenschein",
  lat: 52.52,
  lng: 13.4,
  address: "Musterstraße 1",
  city: "Berlin",
  postalCode: "10115",
  phone: "+49301234567",
  email: "info@kita.de",
  website: "https://kita.de",
  kitaType: "public",
  osmId: "1",
  distanceKm: 1.3,
};

describe("KitaCard", () => {
  it("renders the kita name", () => {
    render(<KitaCard kita={baseKita} selected={false} onSelect={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText("Kita Sonnenschein")).toBeTruthy();
  });

  it("renders the type badge", () => {
    render(<KitaCard kita={baseKita} selected={false} onSelect={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText("Kommunal")).toBeTruthy();
  });

  it("renders address and city", () => {
    render(<KitaCard kita={baseKita} selected={false} onSelect={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText(/Musterstraße 1.*Berlin/)).toBeTruthy();
  });

  it("renders phone number", () => {
    render(<KitaCard kita={baseKita} selected={false} onSelect={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText("+49301234567")).toBeTruthy();
  });

  it("renders email address", () => {
    render(<KitaCard kita={baseKita} selected={false} onSelect={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText("info@kita.de")).toBeTruthy();
  });

  it("renders website link", () => {
    render(<KitaCard kita={baseKita} selected={false} onSelect={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText("Website")).toBeTruthy();
  });

  it("renders distance", () => {
    render(<KitaCard kita={baseKita} selected={false} onSelect={vi.fn()} onApply={vi.fn()} />);
    // t("km_away", { distance: 1.3 }) → "km_away({"distance":1.3})"
    expect(screen.getByText(/km_away/)).toBeTruthy();
  });

  it("omits phone when null", () => {
    const kita = { ...baseKita, phone: null };
    render(<KitaCard kita={kita} selected={false} onSelect={vi.fn()} onApply={vi.fn()} />);
    expect(screen.queryByText("+49301234567")).toBeNull();
  });

  it("omits email when null", () => {
    const kita = { ...baseKita, email: null };
    render(<KitaCard kita={kita} selected={false} onSelect={vi.fn()} onApply={vi.fn()} />);
    expect(screen.queryByText("info@kita.de")).toBeNull();
  });

  it("omits website when null", () => {
    const kita = { ...baseKita, website: null };
    render(<KitaCard kita={kita} selected={false} onSelect={vi.fn()} onApply={vi.fn()} />);
    expect(screen.queryByText("Website")).toBeNull();
  });

  it("omits distance when distanceKm is undefined", () => {
    const kita = { ...baseKita, distanceKm: undefined };
    render(<KitaCard kita={kita} selected={false} onSelect={vi.fn()} onApply={vi.fn()} />);
    expect(screen.queryByText(/km_away/)).toBeNull();
  });

  it("calls onSelect when the card div is clicked", () => {
    const onSelect = vi.fn();
    render(<KitaCard kita={baseKita} selected={false} onSelect={onSelect} onApply={vi.fn()} />);
    fireEvent.click(screen.getByText("Kita Sonnenschein"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("calls onApply when the apply button is clicked (without triggering onSelect)", () => {
    const onSelect = vi.fn();
    const onApply = vi.fn();
    render(<KitaCard kita={baseKita} selected={false} onSelect={onSelect} onApply={onApply} />);
    fireEvent.click(screen.getByText("Jetzt bewerben"));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("applies selected styles when selected=true", () => {
    const { container } = render(
      <KitaCard kita={baseKita} selected={true} onSelect={vi.fn()} onApply={vi.fn()} />
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("border-primary");
  });

  // Badge colour per type
  const typeCases: Array<[OverpassKita["kitaType"], string]> = [
    ["church", "Kirchlich"],
    ["private", "Privat"],
    ["free", "Frei"],
  ];

  typeCases.forEach(([kitaType, label]) => {
    it(`renders badge label '${label}' for type '${kitaType}'`, () => {
      render(
        <KitaCard kita={{ ...baseKita, kitaType }} selected={false} onSelect={vi.fn()} onApply={vi.fn()} />
      );
      expect(screen.getByText(label)).toBeTruthy();
    });
  });
});
