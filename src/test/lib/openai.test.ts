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

  it("exports null when MAX_BASE_URL is not set", async () => {
    vi.stubEnv("MAX_BASE_URL", "");
    const { openai } = await import("@/lib/openai");
    expect(openai).toBeNull();
  });

  it("exports an OpenAI-like object when MAX_BASE_URL is set", async () => {
    vi.stubEnv("MAX_BASE_URL", "http://192.168.178.62:3000/v1");
    vi.resetModules();
    const { openai } = await import("@/lib/openai");
    expect(openai).not.toBeNull();
    expect(openai).toHaveProperty("chat");
  });
});
