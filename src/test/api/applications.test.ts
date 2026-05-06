import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test/helpers/supabase";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { GET, POST } from "@/app/api/applications/route";
import { PATCH, DELETE } from "@/app/api/applications/[id]/route";

const mockApplication = {
  id: "app-1",
  user_id: "u1",
  kita_name: "Kita Test",
  status: "draft",
  cover_letter: "...",
  created_at: "2025-01-01",
};

describe("GET /api/applications", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/applications");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns applications list for authenticated user", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" }, manyData: [mockApplication] }) as never
    );
    const req = new NextRequest("http://localhost/api/applications");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.applications).toHaveLength(1);
  });
});

describe("POST /api/applications", () => {
  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/applications", {
      method: "POST",
      body: JSON.stringify({ kita_name: "Kita", status: "draft", cover_letter: "" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("creates an application and returns 201", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" }, insertData: mockApplication }) as never
    );
    const req = new NextRequest("http://localhost/api/applications", {
      method: "POST",
      body: JSON.stringify({ kita_name: "Kita Test", status: "draft", cover_letter: "..." }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.application.kita_name).toBe("Kita Test");
  });
});

describe("PATCH /api/applications/[id]", () => {
  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/applications/app-1", {
      method: "PATCH",
      body: JSON.stringify({ status: "sent" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "app-1" }) });
    expect(res.status).toBe(401);
  });

  it("updates status and returns 200", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" }, updateData: { ...mockApplication, status: "sent" } }) as never
    );
    const req = new NextRequest("http://localhost/api/applications/app-1", {
      method: "PATCH",
      body: JSON.stringify({ status: "sent" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "app-1" }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.application.status).toBe("sent");
  });
});

describe("DELETE /api/applications/[id]", () => {
  it("returns 401 for unauthenticated requests", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/applications/app-1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "app-1" }) });
    expect(res.status).toBe(401);
  });

  it("deletes application and returns 200", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" }, deleteData: {} }) as never
    );
    const req = new NextRequest("http://localhost/api/applications/app-1", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "app-1" }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
