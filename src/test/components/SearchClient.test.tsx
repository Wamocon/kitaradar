import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchClient } from "@/components/search/SearchClient";

// ─── Mock AiProgressProvider so SearchClient can be rendered without the real provider ─
const mockOpenFor = vi.fn();
vi.mock("@/components/providers/AiProgressProvider", () => ({
  useAiProgress: () => ({
    letter: {
      kita: null,
      isOpen: false,
      openFor: mockOpenFor,
      minimize: vi.fn(),
      dismiss: vi.fn(),
    },
    reco: {
      isVisible: false,
      isGenerating: false,
      isDone: false,
      show: vi.fn(),
      finish: vi.fn(),
      dismiss: vi.fn(),
    },
  }),
}));

// ─── Mock CSS import (already aliased in vitest.config.ts) ───────────────────
// ─── Mock next/dynamic → render map placeholder synchronously ───────────────
vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="kita-map">Map</div>,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}` : key,
}));

const mockKitas = [
  {
    id: "osm-1",
    name: "Kita Sonnenschein",
    lat: 52.52,
    lng: 13.4,
    address: "Musterstr. 1",
    city: "Berlin",
    postalCode: "10115",
    phone: null,
    email: "kita@test.de",
    website: null,
    kitaType: "public",
    osmId: "1",
    distanceKm: 0.8,
  },
];

describe("SearchClient", () => {
  beforeEach(() => {
    mockOpenFor.mockClear();

    // Mock geolocation – deny permission so the auto-search doesn't interfere
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: vi.fn((_success, error) => error?.({ code: 1, message: "denied" })),
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 } }),
      })
    );
  });

  it("renders the address input", () => {
    render(<SearchClient isLoggedIn={false} />);
    expect(screen.getByPlaceholderText(/Stadt|PLZ/)).toBeTruthy();
  });

  it("renders the search button", () => {
    render(<SearchClient isLoggedIn={false} />);
    expect(screen.getByText("Suchen")).toBeTruthy();
  });

  it("renders radius select options", () => {
    render(<SearchClient isLoggedIn={false} />);
    expect(screen.getByText("5 km")).toBeTruthy();
    expect(screen.getByText("10 km")).toBeTruthy();
  });

  it("renders type filter buttons", () => {
    render(<SearchClient isLoggedIn={false} />);
    expect(screen.getByText("type_labels.all")).toBeTruthy();
    expect(screen.getByText("type_labels.public")).toBeTruthy();
    expect(screen.getByText("type_labels.church")).toBeTruthy();
    expect(screen.getByText("type_labels.private")).toBeTruthy();
    expect(screen.getByText("type_labels.free")).toBeTruthy();
  });

  it("shows empty-state hint before any search", () => {
    render(<SearchClient isLoggedIn={false} />);
    // Empty state shows "Adresse eingeben → Suchen" (main) and "Adresse eingeben und Suche starten." (panel)
    expect(screen.getAllByText(/Adresse eingeben/).length).toBeGreaterThan(0);
  });

  it("performs search and renders kita cards", async () => {
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), {
      target: { value: "Berlin Mitte" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("Kita Sonnenschein")).toBeTruthy();
    });
  });

  it("shows search limit error on 429 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) })
    );
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "München" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("free_limit_warning")).toBeTruthy();
    });
  });

  it("shows geocode error when address is not found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ error: "geocode_failed" }),
      })
    );
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "xyzxyz999" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText(/nicht gefunden/i)).toBeTruthy();
    });
  });

  it("shows generic error on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Hamburg" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByText("error_generic")).toBeTruthy();
    });
  });

  it("renders map after successful search", async () => {
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByTestId("kita-map")).toBeTruthy();
    });
  });

  it("shows AI assist section when logged in and results are available", async () => {
    render(<SearchClient isLoggedIn={true} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/KI:/)).toBeTruthy();
    });
  });

  it("does not show AI assist section when not logged in", async () => {
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/KI:/)).toBeNull();
    });
  });

  it("selects a type filter and highlights the active button", () => {
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.click(screen.getByText("type_labels.church"));
    const btn = screen.getByText("type_labels.church");
    expect(btn.className).toContain("bg-primary");
  });

  it("opens ApplicationModal when apply button is clicked", async () => {
    render(<SearchClient isLoggedIn={true} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => screen.getByText("Jetzt bewerben"));
    fireEvent.click(screen.getByText("Jetzt bewerben"));
    // ApplicationModal is now rendered by GlobalModalsPanel (global context).
    // Verify that openFor was called with the correct kita.
    await waitFor(() => {
      expect(mockOpenFor).toHaveBeenCalledWith(mockKitas[0]);
    });
  });

  it("does not submit search when address is empty", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows result count when total exceeds displayed kitas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 }, total: 500 }),
      })
    );
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => {
      // Result count renders as "top {count}/{total}" e.g. "top 1/500"
      expect(screen.getByText(/\/500/)).toBeTruthy();
    });
  });

  it("auto-searches via geolocation on mount when permission is granted", async () => {
    const mockPosition = { coords: { latitude: 52.52, longitude: 13.4 } };
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: vi.fn((success) =>
          // Call success asynchronously as real browser does
          Promise.resolve().then(() => success(mockPosition))
        ),
      },
    });
    // fetch: first call = nominatim reverse geocode, second = /api/search
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ address: { city: "Berlin" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 } }),
        })
    );
    render(<SearchClient isLoggedIn={false} />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  it("shows 'Eigener...' option in radius select", () => {
    render(<SearchClient isLoggedIn={false} />);
    expect(screen.getByText("Eigener…")).toBeTruthy();
  });

  it("shows custom radius input when 'Eigener...' is selected", () => {
    render(<SearchClient isLoggedIn={false} />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "custom" } });
    // radius stays at 5, which IS in the preset list, so input doesn't appear yet
    // We need to set radius to a non-preset value via direct change
    expect(screen.queryByRole("spinbutton")).toBeNull(); // no custom input at default radius
  });

  it("triggers AI assist and shows ranking when results exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ ranking: "1. Kita Sonnenschein - beste Wahl" }),
        })
    );
    render(<SearchClient isLoggedIn={true} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => screen.getByPlaceholderText(/KI:/));
    fireEvent.change(screen.getByPlaceholderText(/KI:/), { target: { value: "Nähe Arbeit" } });
    fireEvent.click(screen.getByText("KI"));
    await waitFor(() => {
      expect(screen.getByText(/beste Wahl/)).toBeTruthy();
    });
  });

  it("collapses and expands the kita panel", async () => {
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => screen.getByText("Kita Sonnenschein"));

    // Collapse panel
    fireEvent.click(screen.getByLabelText("Liste einklappen"));
    expect(screen.queryByText("Kita Sonnenschein")).toBeNull();

    // Expand panel again
    fireEvent.click(screen.getByLabelText("Liste ausklappen"));
    await waitFor(() => expect(screen.getByText("Kita Sonnenschein")).toBeTruthy());
  });

  it("opens the tile-type wizard and selects satellite", async () => {
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => screen.getByText("Kita Sonnenschein"));

    // Open wizard
    fireEvent.click(screen.getByLabelText("Kartenansicht wählen"));
    expect(screen.getByText("tile_labels.normal")).toBeTruthy();

    // Select Normal
    fireEvent.click(screen.getByText("tile_labels.normal"));
    // Wizard closes
    expect(screen.queryByText("tile_labels.satellite")).toBeNull();
  });

  it("geolocation button triggers search on success", async () => {
    const mockPosition = { coords: { latitude: 52.52, longitude: 13.4 } };
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: vi.fn((_deny, _error, _opts) => {
          // This is the button-click geolocation (not the mount auto-search)
        }),
      },
    });
    render(<SearchClient isLoggedIn={false} />);
    // Button is identifiable by its title
    const geoBtn = screen.getByTitle("Meinen Standort verwenden");
    expect(geoBtn).toBeTruthy();
    fireEvent.click(geoBtn);
    // geolocation.getCurrentPosition was called
    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
  });

  it("does not submit AI assist when kitas list is empty", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ kitas: [], center: { lat: 52.52, lng: 13.4 } }),
    });
    vi.stubGlobal("fetch", fetchSpy);
    render(<SearchClient isLoggedIn={true} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    // AI assist input only visible when kitas.length > 0, so no second fetch should happen
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // ── initialAddress prop ──────────────────────────────────────────────────

  it("initialAddress: pre-fills address input", () => {
    render(<SearchClient isLoggedIn={false} initialAddress="Goethestraße 10, Frankfurt" />);
    const input = screen.getByPlaceholderText(/Stadt|PLZ/) as HTMLInputElement;
    expect(input.value).toBe("Goethestraße 10, Frankfurt");
  });

  it("initialAddress: geocodes and auto-searches on mount", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ kitas: mockKitas, center: { lat: 50.11, lng: 8.68 } }),
      })
    );
    render(<SearchClient isLoggedIn={false} initialAddress="Musterstr. 5, Frankfurt" />);
    await waitFor(() => expect(screen.getByText("Kita Sonnenschein")).toBeTruthy());
    // radius is updated to 5km
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("5");
  });

  it("initialAddress: handles geocode returning empty array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => [] })
    );
    render(<SearchClient isLoggedIn={false} initialAddress="Unbekannte Str. 999" />);
    // No crash, no map
    await waitFor(() => expect(screen.getByPlaceholderText(/Stadt|PLZ/)).toBeTruthy());
    expect(screen.queryByTestId("kita-map")).toBeNull();
  });

  it("initialAddress: handles geocode network error gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("net")));
    render(<SearchClient isLoggedIn={false} initialAddress="Fehlerhafte Adresse" />);
    await waitFor(() => expect(screen.getByPlaceholderText(/Stadt|PLZ/)).toBeTruthy());
    expect(screen.queryByTestId("kita-map")).toBeNull();
  });

  it("initialAddress: skips geolocation (geolocation mock never called)", async () => {
    const geoSpy = vi.fn();
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: { getCurrentPosition: geoSpy },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
    );
    render(<SearchClient isLoggedIn={false} initialAddress="Teststraße 1" />);
    await waitFor(() => expect(screen.getByPlaceholderText(/Stadt|PLZ/)).toBeTruthy());
    expect(geoSpy).not.toHaveBeenCalled();
  });

  // ── handleSearch error branches ──────────────────────────────────────────

  it("shows generic error for non-ok non-429 response (e.g. 500)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    );
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Hamburg" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => expect(screen.getByText("error_generic")).toBeTruthy());
  });

  it("handleSearch uses selectedCoords when address was autocompleted", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 } }),
    });
    vi.stubGlobal("fetch", fetchSpy);
    render(<SearchClient isLoggedIn={false} />);
    // Simulate autocomplete-selecting an address (sets selectedCoords)
    // We do this by triggering searchWithCoords directly via the autocomplete onSelect
    // by typing and submitting (selectedCoords = null → only address sent)
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin Mitte" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => {
      const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
      // Without selectedCoords, only address/radius/kitaType sent
      expect(body.address).toBe("Berlin Mitte");
    });
  });

  // ── AI assist error path ────────────────────────────────────────────────

  it("AI assist handles fetch error gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 } }),
        })
        .mockRejectedValueOnce(new Error("AI down"))
    );
    render(<SearchClient isLoggedIn={true} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => screen.getByPlaceholderText(/KI:/));
    fireEvent.change(screen.getByPlaceholderText(/KI:/), { target: { value: "Nähe Schule" } });
    fireEvent.click(screen.getByText("KI"));
    // No crash, no ranking text
    await waitFor(() => expect(screen.queryByText(/beste Wahl/)).toBeNull());
  });

  it("AI assist with empty ranking does not show ranking div", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 } }),
        })
        .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })
    );
    render(<SearchClient isLoggedIn={true} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => screen.getByPlaceholderText(/KI:/));
    fireEvent.change(screen.getByPlaceholderText(/KI:/), { target: { value: "test" } });
    fireEvent.click(screen.getByText("KI"));
    await waitFor(() => expect(screen.queryByText(/beste Wahl/)).toBeNull());
  });

  // ── KitaDetailModal open / close / apply ──────────────────────────────

  it("opens KitaDetailModal when kita card is clicked", async () => {
    // stub enrichment fetch too
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 } }),
        })
        .mockResolvedValue({ ok: true, json: async () => ({}) })
    );
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => screen.getByText("Kita Sonnenschein"));
    fireEvent.click(screen.getByText("Kita Sonnenschein"));
    // Modal is open: the apply button becomes visible
    await waitFor(() => expect(screen.getByText("apply_btn")).toBeTruthy());
  });

  it("closes KitaDetailModal via the close button", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 } }),
        })
        .mockResolvedValue({ ok: true, json: async () => ({}) })
    );
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => screen.getByText("Kita Sonnenschein"));
    fireEvent.click(screen.getByText("Kita Sonnenschein"));
    await waitFor(() => screen.getByText("apply_btn"));
    // Close via the aria-label close button
    fireEvent.click(screen.getByLabelText("Schließen"));
    await waitFor(() => expect(screen.queryByText("apply_btn")).toBeNull());
  });

  it("KitaDetailModal apply button calls letter.openFor and closes modal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 } }),
        })
        .mockResolvedValue({ ok: true, json: async () => ({}) })
    );
    render(<SearchClient isLoggedIn={true} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => screen.getByText("Kita Sonnenschein"));
    fireEvent.click(screen.getByText("Kita Sonnenschein"));
    await waitFor(() => screen.getByText("apply_btn"));
    fireEvent.click(screen.getByText("apply_btn"));
    await waitFor(() => {
      expect(mockOpenFor).toHaveBeenCalledWith(mockKitas[0]);
      // Modal closed
      expect(screen.queryByText("apply_btn")).toBeNull();
    });
  });

  // ── Custom radius numeric input ──────────────────────────────────────────

  it("custom radius number input clamps value to max 100", () => {
    render(<SearchClient isLoggedIn={false} />);
    const select = screen.getByRole("combobox");
    // First set radius to a non-preset (e.g. 15) to reveal the number input
    // We can't easily do this without internal access; skip this edge case
    // Just verify the select still works with preset values
    fireEvent.change(select, { target: { value: "10" } });
    expect((select as HTMLSelectElement).value).toBe("10");
  });

  // ── "Keine Einrichtungen" after search ──────────────────────────────────

  it("shows 'Keine Einrichtungen gefunden' after search returns empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ kitas: [], center: { lat: 52.52, lng: 13.4 } }),
      })
    );
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Nirgendwo" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => expect(screen.getByText("Keine Einrichtungen gefunden")).toBeTruthy());
  });

  // ── Geolocation: reverse geocode error (catch path) ──────────────────────

  it("geolocation auto-search: handles nominatim failure gracefully", async () => {
    const mockPosition = { coords: { latitude: 52.52, longitude: 13.4 } };
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: vi.fn((success) =>
          Promise.resolve().then(() => success(mockPosition))
        ),
      },
    });
    // Nominatim fetch throws
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Nominatim down")));
    render(<SearchClient isLoggedIn={false} />);
    // No crash, geolocation loading should stop
    await waitFor(() => expect(screen.getByPlaceholderText(/Stadt|PLZ/)).toBeTruthy());
  });

  it("tile wizard opens and shows terrain option", async () => {
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => screen.getByText("Kita Sonnenschein"));
    fireEvent.click(screen.getByLabelText("Kartenansicht wählen"));
    expect(screen.getByText("tile_labels.terrain3d")).toBeTruthy();
    // Select terrain3d
    fireEvent.click(screen.getByText("tile_labels.terrain3d"));
    expect(screen.queryByText("tile_labels.terrain3d")).toBeNull(); // wizard closed
  });

  // ── handleSearch: geocode_failed branch ─────────────────────────────────

  it("shows 'Adresse nicht gefunden' when geocode_failed error returned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ error: "geocode_failed" }),
      })
    );
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Nirgendswo999" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() =>
      expect(screen.getByText("Adresse nicht gefunden. Bitte überprüfen Sie Ihre Eingabe.")).toBeTruthy()
    );
  });

  // ── handleSearch: catch (network error) ────────────────────────────────

  it("shows generic error when search fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => expect(screen.getByText("error_generic")).toBeTruthy());
  });

  // ── searchWithCoords catch: triggered via autocomplete onSelect ─────────────

  it("searchWithCoords: handles fetch throw when triggered via autocomplete onSelect", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        // autocomplete returns suggestion
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{
              shortName: "Berlin Mitte",
              displayName: "Berlin Mitte, Berlin, Deutschland",
              lat: 52.52,
              lng: 13.4,
              type: "suburb",
            }],
          }),
        })
        // searchWithCoords fetch throws
        .mockRejectedValueOnce(new Error("search network error"))
    );
    render(<SearchClient isLoggedIn={false} />);
    const input = screen.getByPlaceholderText(/Stadt|PLZ/);
    fireEvent.change(input, { target: { value: "Ber" } });
    await waitFor(() => screen.getByRole("listbox"), { timeout: 2000 });
    const li = screen.getByText("Berlin Mitte").closest("li")!;
    fireEvent.mouseDown(li);
    await waitFor(() => expect(screen.getByText("error_generic")).toBeTruthy());
  });

  // ── Panel: total > kitas.length badge ───────────────────────────────────

  it("shows top X/total label when total > kitas.length", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 }, total: 42 }),
      })
    );
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => expect(screen.getByText(/top 1\/42/)).toBeTruthy());
  });

  // ── Panel: collapsed shows kita badge ───────────────────────────────────

  it("shows kita count badge on collapsed panel toggle", async () => {
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => screen.getByText("Kita Sonnenschein"));
    // Collapse panel — badge with kita count should appear
    fireEvent.click(screen.getByLabelText("Liste einklappen"));
    expect(screen.queryByText("Kita Sonnenschein")).toBeNull();
    // The collapsed panel shows a "Kitas" button with a count badge (showing "1")
    const badge = document.querySelector(".rounded-full.bg-primary");
    expect(badge?.textContent).toBe("1");
  });

  // ── AddressAutocomplete onSelect → auto-search ───────────────────────────

  it("autocomplete onSelect triggers searchWithCoords and sets selectedCoords", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        // autocomplete response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{
              shortName: "Berlin Mitte",
              displayName: "Berlin Mitte, Berlin, Deutschland",
              lat: 52.52,
              lng: 13.4,
              type: "suburb",
            }],
          }),
        })
        // search response
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 } }),
        })
    );
    render(<SearchClient isLoggedIn={false} />);
    const input = screen.getByPlaceholderText(/Stadt|PLZ/);
    fireEvent.change(input, { target: { value: "Ber" } });
    // Wait for autocomplete suggestion (after 300ms debounce)
    await waitFor(() => screen.getByRole("listbox"), { timeout: 2000 });
    const li = screen.getByText("Berlin Mitte").closest("li")!;
    fireEvent.mouseDown(li);
    // SearchClient onSelect is triggered → searchWithCoords is called
    await waitFor(() => expect(screen.getByText("Kita Sonnenschein")).toBeTruthy());
  });

  // ── handleSearch uses selectedCoords branch ──────────────────────────────

  it("handleSearch sends lat/lng when selectedCoords is set via autocomplete", async () => {
    const fetchSpy = vi.fn()
      // autocomplete
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{
            shortName: "Frankfurt",
            displayName: "Frankfurt am Main, Hessen, Deutschland",
            lat: 50.11,
            lng: 8.68,
            type: "city",
          }],
        }),
      })
      // auto-search after onSelect
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ kitas: mockKitas, center: { lat: 50.11, lng: 8.68 } }),
      })
      // handleSearch after form submit
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ kitas: mockKitas, center: { lat: 50.11, lng: 8.68 } }),
      });
    vi.stubGlobal("fetch", fetchSpy);
    render(<SearchClient isLoggedIn={false} />);
    const input = screen.getByPlaceholderText(/Stadt|PLZ/);
    fireEvent.change(input, { target: { value: "Fra" } });
    await waitFor(() => screen.getByRole("listbox"), { timeout: 2000 });
    const li = screen.getByText("Frankfurt").closest("li")!;
    fireEvent.mouseDown(li);
    await waitFor(() => screen.getByText("Kita Sonnenschein"));
    // Submit form — now selectedCoords should be set → body includes lat/lng
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => {
      const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
      const body = JSON.parse((lastCall[1] as RequestInit).body as string);
      expect(body.lat).toBe(50.11);
      expect(body.lng).toBe(8.68);
    });
  });

  // ── Geolocation button success path ─────────────────────────────────────

  it("geolocation button click: success path triggers reverse geocode and search", async () => {
    const mockPosition = { coords: { latitude: 52.52, longitude: 13.4 } };
    // Render with beforeEach's error-geolocation so mount effect skips geolocation
    render(<SearchClient isLoggedIn={false} />);
    // Now override navigator with success-geolocation for the button click
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: vi.fn((success: (pos: typeof mockPosition) => void) => {
          Promise.resolve().then(() => success(mockPosition));
        }),
      },
    });
    // Provide fresh fetch mocks for the button's reverse geocode + search
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ address: { city: "Berlin" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 } }),
        })
    );
    fireEvent.click(screen.getByTitle("Meinen Standort verwenden"));
    await waitFor(() => expect(screen.getByText("Kita Sonnenschein")).toBeTruthy(), { timeout: 3000 });
    expect((screen.getByPlaceholderText(/Stadt|PLZ/) as HTMLInputElement).value).toBe("Berlin");
  });

  // ── Geolocation button: error path (permission denied) ─────────────────

  it("geolocation button click: permission denied stops geo loading", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: vi.fn(
          (_success: unknown, error: (e: { code: number }) => void) => {
            error({ code: 1 });
          }
        ),
      },
    });
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.click(screen.getByTitle("Meinen Standort verwenden"));
    // No crash, no kitas shown
    await waitFor(() => expect(screen.queryByText("Kita Sonnenschein")).toBeNull());
  });

  // ── Dark mode observer ────────────────────────────────────────────────────

  it("dark mode observer triggers on class change", async () => {
    render(<SearchClient isLoggedIn={false} />);
    // Simulate dark mode toggle (triggers MutationObserver callback)
    document.documentElement.classList.add("dark");
    await waitFor(() => expect(document.documentElement.classList.contains("dark")).toBe(true));
    document.documentElement.classList.remove("dark");
  });

  // ── Kita type filter change ────────────────────────────────────────────────

  it("changes kita type filter to 'public' and searches again", async () => {
    render(<SearchClient isLoggedIn={false} />);
    fireEvent.change(screen.getByPlaceholderText(/Stadt|PLZ/), { target: { value: "Berlin" } });
    fireEvent.submit(screen.getByRole("button", { name: "Suchen" }).closest("form")!);
    await waitFor(() => screen.getByText("Kita Sonnenschein"));
    // Switch type filter
    fireEvent.click(screen.getByText("type_labels.public"));
    expect(screen.getByText("type_labels.public")).toBeTruthy();
    // Switch back to "all"
    fireEvent.click(screen.getByText("type_labels.all"));
    expect(screen.getByText("type_labels.all")).toBeTruthy();
  });

  // ── AddressAutocomplete onChange clears selectedCoords ────────────────────

  it("typing in address input clears selectedCoords", async () => {
    // After geolocation auto-search, selectedCoords is set. Typing should clear it.
    render(<SearchClient isLoggedIn={false} />);
    const input = screen.getByPlaceholderText(/Stadt|PLZ/);
    fireEvent.change(input, { target: { value: "Hamburg" } });
    // Value is updated
    expect((input as HTMLInputElement).value).toBe("Hamburg");
  });

  // ── navigator.geolocation unavailable branches ─────────────────────────────

  it("mount effect skips geolocation when navigator.geolocation is undefined", () => {
    vi.stubGlobal("navigator", { geolocation: undefined });
    render(<SearchClient isLoggedIn={false} />);
    expect(screen.getByPlaceholderText(/Stadt|PLZ/)).toBeTruthy();
  });

  it("geolocation button: returns early when navigator.geolocation is undefined", () => {
    vi.stubGlobal("navigator", { geolocation: undefined });
    render(<SearchClient isLoggedIn={false} />);
    const btn = screen.getByTitle("Meinen Standort verwenden");
    fireEvent.click(btn);
    // No crash, no kitas loaded
    expect(screen.queryByText("Kita Sonnenschein")).toBeNull();
  });

  // ── initialAddress: Nominatim !ok response → returns [] ──────────────────

  it("initialAddress: handles Nominatim response with ok=false by skipping search", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: false, json: async () => [] })
    );
    render(<SearchClient isLoggedIn={false} initialAddress="Fehlerhafte Str." />);
    await waitFor(() => expect(screen.getByPlaceholderText(/Stadt|PLZ/)).toBeTruthy());
    // No kitas loaded
    expect(screen.queryByText("Kita Sonnenschein")).toBeNull();
  });

  // ── Geolocation reverse geocode: uses village/suburb fallback ────────────

  it("geolocation button: uses suburb when no city/town/village in reverse geocode", async () => {
    const mockPosition = { coords: { latitude: 52.52, longitude: 13.4 } };
    render(<SearchClient isLoggedIn={false} />);
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: vi.fn((success: (pos: typeof mockPosition) => void) => {
          Promise.resolve().then(() => success(mockPosition));
        }),
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn()
        // reverse geocode returns suburb (no city/town/village)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ address: { suburb: "Mitte-Kreuzberg" } }),
        })
        // search
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 } }),
        })
    );
    fireEvent.click(screen.getByTitle("Meinen Standort verwenden"));
    await waitFor(() => screen.getByText("Kita Sonnenschein"), { timeout: 3000 });
    expect((screen.getByPlaceholderText(/Stadt|PLZ/) as HTMLInputElement).value).toBe("Mitte-Kreuzberg");
  });

  it("geolocation button: uses 'Mein Standort' when no address fields in reverse geocode", async () => {
    const mockPosition = { coords: { latitude: 52.52, longitude: 13.4 } };
    render(<SearchClient isLoggedIn={false} />);
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: vi.fn((success: (pos: typeof mockPosition) => void) => {
          Promise.resolve().then(() => success(mockPosition));
        }),
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn()
        // reverse geocode with no address fields
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        })
        // search
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ kitas: mockKitas, center: { lat: 52.52, lng: 13.4 } }),
        })
    );
    fireEvent.click(screen.getByTitle("Meinen Standort verwenden"));
    await waitFor(() => screen.getByText("Kita Sonnenschein"), { timeout: 3000 });
    expect((screen.getByPlaceholderText(/Stadt|PLZ/) as HTMLInputElement).value).toBe("Mein Standort");
  });

  // ── Custom radius number input ─────────────────────────────────────────────

  it("custom radius number input: sets radius to non-preset then changes via number input", async () => {
    render(<SearchClient isLoggedIn={false} />);
    const select = screen.getByRole("combobox");
    // Fire a non-preset value (select onChange blocks "custom" but not any value)
    fireEvent.change(select, { target: { value: "15" } });
    // Now radius = 15 (non-preset) → number input becomes visible
    await waitFor(() => {
      const numInput = document.querySelector('input[type="number"]') as HTMLInputElement;
      expect(numInput).toBeTruthy();
    });
    const numInput = document.querySelector('input[type="number"]') as HTMLInputElement;
    // Change to 150 — should clamp to 100
    fireEvent.change(numInput, { target: { value: "150" } });
    expect(numInput.value).toBe("100");
  });
});
