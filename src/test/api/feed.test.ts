import { describe, it, expect, vi } from "vitest";
import { createSupabaseMock } from "@/test/helpers/supabase";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { GET, POST } from "@/app/api/feed/posts/route";
import { POST as UPVOTE } from "@/app/api/feed/posts/[id]/upvote/route";
import { POST as REPORT } from "@/app/api/feed/posts/[id]/report/route";

const mockPost = {
  id: "p1",
  title: "Tipps",
  content: "Früh bewerben!",
  tag: "tip",
  upvotes: 3,
  created_at: "2025-01-01T00:00:00Z",
  profiles: { full_name: "Max" },
};

describe("GET /api/feed/posts", () => {
  it("returns posts list", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null, manyData: [mockPost] }) as never
    );
    const req = new NextRequest("http://localhost/api/feed/posts");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.posts).toHaveLength(1);
  });

  it("filters posts by tag", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null, manyData: [mockPost] }) as never
    );
    const req = new NextRequest("http://localhost/api/feed/posts?tag=tip");
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.posts[0].tag).toBe("tip");
  });
});

describe("POST /api/feed/posts", () => {
  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/feed/posts", {
      method: "POST",
      body: JSON.stringify({ title: "T", content: "C", tag: "tip" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 for free-tier users", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        user: { id: "u1" },
        singleData: { subscription_tier: "free" },
      }) as never
    );
    const req = new NextRequest("http://localhost/api/feed/posts", {
      method: "POST",
      body: JSON.stringify({ title: "T", content: "C", tag: "tip" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it("creates post for Pro users and returns 201", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({
        user: { id: "u1" },
        singleData: { subscription_tier: "pro" },
        insertData: mockPost,
      }) as never
    );
    const req = new NextRequest("http://localhost/api/feed/posts", {
      method: "POST",
      body: JSON.stringify({ title: "Tipps", content: "Früh bewerben!", tag: "tip" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.post.title).toBe("Tipps");
  });
});

describe("POST /api/feed/posts/[id]/upvote", () => {
  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/feed/posts/p1/upvote", { method: "POST" });
    const res = await UPVOTE(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(401);
  });

  it("increments upvote for authenticated user", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" } }) as never
    );
    const req = new NextRequest("http://localhost/api/feed/posts/p1/upvote", { method: "POST" });
    const res = await UPVOTE(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/feed/posts/[id]/report", () => {
  it("returns 401 for unauthenticated users", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: null }) as never
    );
    const req = new NextRequest("http://localhost/api/feed/posts/p1/report", { method: "POST" });
    const res = await REPORT(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(401);
  });

  it("inserts a report for authenticated user", async () => {
    vi.mocked(createClient).mockResolvedValue(
      createSupabaseMock({ user: { id: "u1" }, insertData: {} }) as never
    );
    const req = new NextRequest("http://localhost/api/feed/posts/p1/report", { method: "POST" });
    const res = await REPORT(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
  });
});
