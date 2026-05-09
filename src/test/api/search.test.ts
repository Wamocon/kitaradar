import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test/helpers/supabase";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/overpass", () => ({
  geocodeAddress: vi.fn(),
  searchKitasOverpass: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { geocodeAddress, searchKitasOverpass } from "@/lib/overpass";
import { POST } from "@/app/api/search/route";

const mockKitas = [
  { id: "osm-1", name: "Kita Test", lat: 52.52, lng: 13.4, kitaType: "public", distanceKm: 0.5 },
];

describe("POST /api/search", () => {
  beforeEach(() => {
    vi.mocked(geocodeAddress).mockResolvedValue({ lat: 52.52, lng: 13.4 });
    vi.mocked(searchKitasOverpass).mockResolvedValue(mockKitas as never);
  });

  it("returns kitas for a valid address (unauthenticated — no limit check)", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/search", {
      method: "POST",
      body: JSON.stringify({ address: "Berlin Mitte", radius: 5000, types: [] }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.kitas).toHaveLength(1);
    expect(data.center).toEqual({ lat: 52.52, lng: 13.4 });
  });

  it("returns 429 when authenticated user has reached search limit", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        user: { id: "u1", email: "t@t.de" },
        singleData: { search_count: 10, tier: "free" },
      }) as never
    );
    const req = new NextRequest("http://localhost/api/search", {
      method: "POST",
      body: JSON.stringify({ address: "Berlin", radius: 5000, types: [] }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("returns 200 for Pro users even with high search count", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        user: { id: "u1", email: "t@t.de" },
        singleData: { search_count: 99, tier: "pro" },
      }) as never
    );
    const req = new NextRequest("http://localhost/api/search", {
      method: "POST",
      body: JSON.stringify({ address: "München", radius: 5000, types: [] }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 when address is missing", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/search", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 422 when geocoding fails", async () => {
    vi.mocked(geocodeAddress).mockResolvedValue(null);
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/search", {
      method: "POST",
      body: JSON.stringify({ address: "xyz_not_found", radius: 5000, types: [] }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });
});
