import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn().mockReturnValue({ __isMockClient: true }),
}));

describe("supabase browser client", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("createClient returns a Supabase client", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SCHEMA", "kitaradar-dev");
    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();
    expect(client).toBeDefined();
  });

  it("createClient uses default schema when env is not set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SCHEMA", "");

    const { createBrowserClient } = await import("@supabase/ssr");
    const { createClient } = await import("@/lib/supabase/client");
    createClient();

    // called with db.schema = 'kitaradar-dev' (default)
    expect(createBrowserClient).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ db: expect.objectContaining({ schema: "kitaradar-dev" }) })
    );
  });
});
