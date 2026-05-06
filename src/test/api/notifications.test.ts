import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test/helpers/supabase";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { GET, PATCH } from "@/app/api/notifications/route";

const mockNotification = {
  id: "n1",
  user_id: "u1",
  message: "Ihre Bewerbung wurde gesehen",
  read: false,
  created_at: "2025-01-01T00:00:00Z",
};

describe("GET /api/notifications", () => {
  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/notifications");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns notifications list", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" }, manyData: [mockNotification] }) as never
    );
    const req = new NextRequest("http://localhost/api/notifications");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.notifications).toHaveLength(1);
    expect(data.notifications[0].message).toBe("Ihre Bewerbung wurde gesehen");
  });
});

describe("PATCH /api/notifications", () => {
  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ all: true }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("marks all notifications as read when all=true", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" }, updateData: {} }) as never
    );
    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ all: true }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("marks specific notifications as read when ids are provided", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" }, updateData: {} }) as never
    );
    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ ids: ["n1"] }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("returns 400 when neither all nor ids is provided", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" } }) as never
    );
    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});
