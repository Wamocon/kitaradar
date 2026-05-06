import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test/helpers/supabase";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { GET as EXPORT } from "@/app/api/user/export/route";
import { DELETE as DELETE_ACCOUNT } from "@/app/api/user/account/route";
import { PATCH as PATCH_PROFILE } from "@/app/api/user/profile/route";
import { POST as ADD_CHILD } from "@/app/api/user/children/route";
import { DELETE as DELETE_CHILD } from "@/app/api/user/children/[id]/route";

const mockExportData = {
  user: { id: "u1", email: "t@t.de" },
  profile: { full_name: "Anna" },
  children: [],
  applications: [],
};

describe("GET /api/user/export", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/user/export");
    const res = await EXPORT(req);
    expect(res.status).toBe(401);
  });

  it("returns JSON export for authenticated user", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        user: { id: "u1", email: "t@t.de" },
        singleData: mockExportData.profile,
        manyData: [],
      }) as never
    );
    const req = new NextRequest("http://localhost/api/user/export");
    const res = await EXPORT(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const data = await res.json();
    expect(data.user).toBeDefined();
  });
});

describe("DELETE /api/user/account", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    vi.mocked(createAdminClient).mockResolvedValue(
      createSupabaseMock({}) as never
    );
    const req = new NextRequest("http://localhost/api/user/account", { method: "DELETE" });
    const res = await DELETE_ACCOUNT(req);
    expect(res.status).toBe(401);
  });

  it("deletes account and returns 200", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" }, deleteData: {} }) as never
    );
    vi.mocked(createAdminClient).mockResolvedValue(
      createSupabaseMock({ deleteData: {} }) as never
    );
    const req = new NextRequest("http://localhost/api/user/account", { method: "DELETE" });
    const res = await DELETE_ACCOUNT(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe("PATCH /api/user/profile", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ full_name: "Max" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH_PROFILE(req);
    expect(res.status).toBe(401);
  });

  it("updates profile and returns 200", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" }, updateData: { full_name: "Max" } }) as never
    );
    const req = new NextRequest("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ full_name: "Max" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await PATCH_PROFILE(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.profile.full_name).toBe("Max");
  });
});

describe("POST /api/user/children", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/user/children", {
      method: "POST",
      body: JSON.stringify({ name: "Tim" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await ADD_CHILD(req);
    expect(res.status).toBe(401);
  });

  it("adds a child and returns 201", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        user: { id: "u1" },
        insertData: { id: "c2", user_id: "u1", name: "Tim", birth_month: null, birth_year: null, special_needs: null },
      }) as never
    );
    const req = new NextRequest("http://localhost/api/user/children", {
      method: "POST",
      body: JSON.stringify({ name: "Tim" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await ADD_CHILD(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.child.name).toBe("Tim");
  });
});

describe("DELETE /api/user/children/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/user/children/c1", { method: "DELETE" });
    const res = await DELETE_CHILD(req, { params: Promise.resolve({ id: "c1" }) });
    expect(res.status).toBe(401);
  });

  it("deletes a child and returns 200", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" }, deleteData: {} }) as never
    );
    const req = new NextRequest("http://localhost/api/user/children/c1", { method: "DELETE" });
    const res = await DELETE_CHILD(req, { params: Promise.resolve({ id: "c1" }) });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
