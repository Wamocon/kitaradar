import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/navigation before importing admin
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("admin lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("isAdminUser returns false when no user is logged in", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never);

    const { isAdminUser } = await import("@/lib/admin");
    const result = await isAdminUser();
    expect(result).toBe(false);
  });

  it("isAdminUser returns false when user has non-admin role", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: "parent" } }),
      }),
    } as never);

    const { isAdminUser } = await import("@/lib/admin");
    const result = await isAdminUser();
    expect(result).toBe(false);
  });

  it("isAdminUser returns true when user has admin role", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
      }),
    } as never);

    const { isAdminUser } = await import("@/lib/admin");
    const result = await isAdminUser();
    expect(result).toBe(true);
  });

  it("requireAdmin calls redirect when user is not admin", async () => {
    const { redirect } = await import("next/navigation");
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never);

    const { requireAdmin } = await import("@/lib/admin");
    await requireAdmin("de");
    expect(redirect).toHaveBeenCalledWith("/de/dashboard");
  });

  it("requireAdmin does not redirect when user is admin", async () => {
    const { redirect } = await import("next/navigation");
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: "admin" } }),
      }),
    } as never);

    const { requireAdmin } = await import("@/lib/admin");
    await requireAdmin("de");
    expect(redirect).not.toHaveBeenCalled();
  });
});
