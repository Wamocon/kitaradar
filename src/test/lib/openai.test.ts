import { describe, it, expect, vi, afterEach } from "vitest";

// Mock the openai package to avoid browser-environment detection error in jsdom
// Uses a class so 'new OpenAI(...)' works correctly
vi.mock("openai", () => {
  class MockOpenAI {
    chat = { completions: { create: vi.fn() } };
  }
  return { default: MockOpenAI };
});

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
    vi.resetModules();
    const { openai } = await import("@/lib/openai");
    expect(openai).not.toBeNull();
    expect(openai).toHaveProperty("chat");
  });
});
