import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { geocodeAddress, searchKitasOverpass } from "@/lib/overpass";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const BERLIN = { lat: 52.52, lng: 13.405 };

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

// ─── geocodeAddress ───────────────────────────────────────────────────────────
describe("geocodeAddress", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns lat/lng for a valid address", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, [{ lat: "52.52", lon: "13.405", display_name: "Berlin, Deutschland" }])
    );
    const result = await geocodeAddress("Berlin");
    expect(result).toEqual({ lat: 52.52, lng: 13.405 });
  });

  it("returns null when Nominatim returns an empty array", async () => {
    vi.stubGlobal("fetch", mockFetch(200, []));
    const result = await geocodeAddress("irgendeinUnbekannterOrt12345");
    expect(result).toBeNull();
  });

  it("returns null when the HTTP request fails (status 500)", async () => {
    vi.stubGlobal("fetch", mockFetch(500, {}));
    const result = await geocodeAddress("Berlin");
    expect(result).toBeNull();
  });

  it("sends the correct User-Agent header", async () => {
    const fetchSpy = mockFetch(200, [{ lat: "52.52", lon: "13.405", display_name: "Berlin" }]);
    vi.stubGlobal("fetch", fetchSpy);
    await geocodeAddress("Berlin");
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["User-Agent"]).toContain("KitaRadar");
  });

  it("encodes the address in the URL", async () => {
    const fetchSpy = mockFetch(200, []);
    vi.stubGlobal("fetch", fetchSpy);
    await geocodeAddress("Musterstraße 1, Frankfurt");
    const [url] = fetchSpy.mock.calls[0] as [string];
    expect(url).toContain(encodeURIComponent("Musterstraße 1, Frankfurt"));
  });
});

// ─── searchKitasOverpass ──────────────────────────────────────────────────────
describe("searchKitasOverpass", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty array when the HTTP request fails", async () => {
    vi.stubGlobal("fetch", mockFetch(503, {}));
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result).toEqual([]);
  });

  it("returns an empty array when the response has no elements", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { elements: [] }));
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result).toEqual([]);
  });

  it("filters out elements without lat/center", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        elements: [
          { type: "relation", id: 1, tags: { name: "Kita ohne Position" } }, // no lat, no center
        ],
      })
    );
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result).toHaveLength(0);
  });

  it("maps a node element with lat/lon correctly", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        elements: [
          {
            type: "node",
            id: 42,
            lat: 52.53,
            lon: 13.41,
            tags: {
              name: "Kita Sonnenschein",
              "addr:street": "Hauptstraße",
              "addr:housenumber": "5",
              "addr:city": "Berlin",
              "addr:postcode": "10115",
              "contact:phone": "+49301234",
              "contact:email": "kita@example.de",
              "contact:website": "https://example.de",
            },
          },
        ],
      })
    );
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result).toHaveLength(1);
    const kita = result[0];
    expect(kita.id).toBe("osm-42");
    expect(kita.name).toBe("Kita Sonnenschein");
    expect(kita.lat).toBe(52.53);
    expect(kita.lng).toBe(13.41);
    expect(kita.address).toBe("Hauptstraße 5");
    expect(kita.city).toBe("Berlin");
    expect(kita.postalCode).toBe("10115");
    expect(kita.phone).toBe("+49301234");
    expect(kita.email).toBe("kita@example.de");
    expect(kita.website).toBe("https://example.de");
    expect(kita.osmId).toBe("42");
  });

  it("maps a way element via center coordinates", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        elements: [
          {
            type: "way",
            id: 99,
            center: { lat: 52.54, lon: 13.42 },
            tags: { name: "Kita via Way" },
          },
        ],
      })
    );
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result).toHaveLength(1);
    expect(result[0].lat).toBe(52.54);
    expect(result[0].lng).toBe(13.42);
  });

  it("uses 'phone' tag as fallback when 'contact:phone' is absent", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        elements: [
          { type: "node", id: 1, lat: 52.52, lon: 13.41, tags: { phone: "+49 30 999" } },
        ],
      })
    );
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result[0].phone).toBe("+49 30 999");
  });

  it("uses 'email' tag as fallback when 'contact:email' is absent", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        elements: [
          { type: "node", id: 1, lat: 52.52, lon: 13.41, tags: { email: "info@kita.de" } },
        ],
      })
    );
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result[0].email).toBe("info@kita.de");
  });

  it("returns null for phone/email/website when tags are absent", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        elements: [{ type: "node", id: 1, lat: 52.52, lon: 13.41, tags: {} }],
      })
    );
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result[0].phone).toBeNull();
    expect(result[0].email).toBeNull();
    expect(result[0].website).toBeNull();
  });

  it("falls back to 'Unbekannte Einrichtung' when name tag is absent", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        elements: [{ type: "node", id: 1, lat: 52.52, lon: 13.41, tags: {} }],
      })
    );
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result[0].name).toBe("Unbekannte Einrichtung");
  });

  // ─── kitaType classification ─────────────────────────────────────────────
  const classificationCases: Array<[string, Record<string, string>, "public" | "church" | "private" | "free"]> = [
    ["kirchlich → church", { "operator:type": "kirchlich" }, "church"],
    ["caritas → church", { operator: "Caritas" }, "church"],
    ["diakonie → church", { operator: "Diakonie" }, "church"],
    ["church keyword → church", { operator: "Church of XY" }, "church"],
    ["kommunal → public", { "operator:type": "kommunal" }, "public"],
    ["städtisch → public", { operator: "Städtisch" }, "public"],
    ["städtische → public", { operator: "Städtische Kita GmbH" }, "public"],
    ["gemeinde → public", { operator: "Gemeinde Musterstadt" }, "public"],
    ["privat → private", { "operator:type": "privat" }, "private"],
    ["gmbh → private", { operator: "Kita GmbH" }, "private"],
    ["ag → private", { operator: "Kinder AG" }, "private"],
    ["unknown → free", { operator: "Freie Träger" }, "free"],
    ["no operator → free", {}, "free"],
  ];

  classificationCases.forEach(([label, tags, expected]) => {
    it(`classifies kitaType: ${label}`, async () => {
      vi.stubGlobal(
        "fetch",
        mockFetch(200, {
          elements: [{ type: "node", id: 1, lat: 52.52, lon: 13.41, tags }],
        })
      );
      const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
      expect(result[0].kitaType).toBe(expected);
    });
  });

  it("calculates distanceKm using haversine formula (same location → 0 km)", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        elements: [{ type: "node", id: 1, lat: BERLIN.lat, lon: BERLIN.lng, tags: {} }],
      })
    );
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result[0].distanceKm).toBe(0);
  });

  it("calculates distanceKm > 0 for nearby location", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        elements: [{ type: "node", id: 1, lat: 52.53, lon: 13.42, tags: {} }],
      })
    );
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result[0].distanceKm).toBeGreaterThan(0);
    expect(result[0].distanceKm).toBeLessThan(5);
  });

  it("rounds distanceKm to 1 decimal place", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        elements: [{ type: "node", id: 1, lat: 52.53, lon: 13.42, tags: {} }],
      })
    );
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    const km = result[0].distanceKm!;
    expect(km).toBe(parseFloat(km.toFixed(1)));
  });

  it("uses POST method and sends Overpass QL in the body", async () => {
    const fetchSpy = mockFetch(200, { elements: [] });
    vi.stubGlobal("fetch", fetchSpy);
    await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 3000);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("overpass-api.de");
    expect(init.method).toBe("POST");
    expect(init.body).toContain("kindergarten");
  });

  it("includes the radius in the Overpass query", async () => {
    const fetchSpy = mockFetch(200, { elements: [] });
    vi.stubGlobal("fetch", fetchSpy);
    await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 7500);
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.body).toContain("7500");
  });

  // ── tryEndpoint catch block (lines 101-102): fetch throws network error ───

  it("returns empty array when fetch throws (network-level failure)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result).toEqual([]);
  });

  // ── capacity, minAge, maxAge, wheelchair tag coverage (lines 167, 171-173) ─

  it("parses numeric capacity, minAge, maxAge and wheelchair=yes", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        elements: [
          {
            type: "node",
            id: 99,
            lat: 52.52,
            lon: 13.41,
            tags: {
              name: "Kita Tags",
              capacity: "30",
              min_age: "1.5",
              max_age: "6",
              wheelchair: "yes",
            },
          },
        ],
      })
    );
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result[0].capacity).toBe(30);
    expect(result[0].minAge).toBe(1.5);
    expect(result[0].maxAge).toBe(6);
    expect(result[0].wheelchair).toBe(true);
  });

  it("returns wheelchair=false for wheelchair=no tag", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetch(200, {
        elements: [
          { type: "node", id: 100, lat: 52.52, lon: 13.41, tags: { wheelchair: "no" } },
        ],
      })
    );
    const result = await searchKitasOverpass(BERLIN.lat, BERLIN.lng, 5000);
    expect(result[0].wheelchair).toBe(false);
  });
});
