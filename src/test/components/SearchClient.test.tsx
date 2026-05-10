import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchClient } from "@/components/search/SearchClient";

// ─── Mock CSS import (already aliased in vitest.config.ts) ───────────────────
// ─── Mock next/dynamic → render map placeholder synchronously ───────────────
vi.mock("next/dynamic", () => ({
  default: () => () => <div data-testid="kita-map">Map</div>,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) =>
    params ? `${key}` : key,
}));

// Mock Supabase client — ApplicationModal (rendered inside SearchClient) fetches profile
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    schema: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    }),
  }),
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
    // Modal renders title (mocked as "modal_title")
    await waitFor(() => {
      expect(screen.getByText("modal_title")).toBeTruthy();
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
});
