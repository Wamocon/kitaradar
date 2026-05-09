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

  it("exports null when MAX_AI_BASE_URL is not set", async () => {
    vi.stubEnv("MAX_AI_BASE_URL", "");
    const { openai } = await import("@/lib/openai");
    expect(openai).toBeNull();
  });

  it("exports an OpenAI-like object when MAX_AI_BASE_URL is set", async () => {
    vi.stubEnv("MAX_AI_BASE_URL", "http://192.168.178.75:4000/v1");
    vi.resetModules();
    const { openai } = await import("@/lib/openai");
    expect(openai).not.toBeNull();
    expect(openai).toHaveProperty("chat");
  });

  it("getModel returns default model when no task is specified", async () => {
    vi.stubEnv("MAX_AI_MODEL_DEFAULT", "qwen3.6:35b");
    vi.resetModules();
    const { getModel } = await import("@/lib/openai");
    expect(getModel()).toBe("qwen3.6:35b");
  });

  it("getModel returns task-specific model when configured", async () => {
    vi.stubEnv("MAX_AI_MODEL_REASONING", "qwen3.5:122b");
    vi.resetModules();
    const { getModel } = await import("@/lib/openai");
    expect(getModel("reasoning")).toBe("qwen3.5:122b");
  });
});
