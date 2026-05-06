import { describe, it, expect, vi, afterEach } from "vitest";

describe("openai lib", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("exports null when OPENAI_API_KEY is not set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const { openai } = await import("@/lib/openai");
    expect(openai).toBeNull();
  });

  it("exports an OpenAI-like object when OPENAI_API_KEY is set", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-fake");
    const { openai } = await import("@/lib/openai");
    expect(openai).not.toBeNull();
    // OpenAI SDK exposes chat, completions etc.
    expect(openai).toHaveProperty("chat");
  });
});
