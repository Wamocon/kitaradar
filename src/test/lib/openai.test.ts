import { describe, it, expect, vi, afterEach } from "vitest";

// Mock the openai package to avoid browser-environment detection error in jsdom
// Uses a class so 'new OpenAI(...)' works correctly
const mockCreate = vi.fn();
vi.mock("openai", () => {
  class MockOpenAI {
    chat = { completions: { create: mockCreate } };
  }
  return { default: MockOpenAI };
});

describe("openai lib", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    mockCreate.mockReset();
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

  it("getModel falls back to FALLBACK_MODEL when no env var is set", async () => {
    vi.resetModules();
    const { getModel } = await import("@/lib/openai");
    expect(getModel("vision")).toBe("gemma4:31b");
  });

  it("getModel returns correct model for all task types", async () => {
    vi.stubEnv("MAX_AI_MODEL_DEFAULT", "model-default");
    vi.stubEnv("MAX_AI_MODEL_REASONING", "model-reasoning");
    vi.stubEnv("MAX_AI_MODEL_TOOLS", "model-tools");
    vi.stubEnv("MAX_AI_MODEL_VISION", "model-vision");
    vi.stubEnv("MAX_AI_MODEL_EMBEDDING", "model-embedding");
    vi.resetModules();
    const { getModel } = await import("@/lib/openai");
    expect(getModel("default")).toBe("model-default");
    expect(getModel("reasoning")).toBe("model-reasoning");
    expect(getModel("tools")).toBe("model-tools");
    expect(getModel("vision")).toBe("model-vision");
    expect(getModel("embedding")).toBe("model-embedding");
  });

  it("createMaxCompletion throws when openai client is not initialised", async () => {
    vi.stubEnv("MAX_AI_BASE_URL", "");
    vi.resetModules();
    const { createMaxCompletion } = await import("@/lib/openai");
    await expect(
      createMaxCompletion({ model: "test", messages: [] })
    ).rejects.toThrow("MAX AI client not initialised");
  });

  it("createMaxCompletion calls openai.chat.completions.create with enable_thinking false", async () => {
    vi.stubEnv("MAX_AI_BASE_URL", "http://localhost:4000/v1");
    vi.resetModules();
    const fakeCompletion = { id: "cmpl-1", choices: [] };
    mockCreate.mockResolvedValueOnce(fakeCompletion);
    const { createMaxCompletion } = await import("@/lib/openai");
    const result = await createMaxCompletion({ model: "gemma4", messages: [{ role: "user", content: "hello" }] });
    expect(result).toBe(fakeCompletion);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ enable_thinking: false, model: "gemma4" })
    );
  });

  describe("extractCoTResponse", () => {
    it("returns content outside think blocks (Layout A)", async () => {
      vi.resetModules();
      const { extractCoTResponse } = await import("@/lib/openai");
      const raw = "<think>some reasoning here</think>\n\nFinal answer text";
      expect(extractCoTResponse(raw)).toBe("Final answer text");
    });

    it("returns last think block content when nothing is outside (Layout B)", async () => {
      vi.resetModules();
      const { extractCoTResponse } = await import("@/lib/openai");
      const raw = "<think>reasoning\nANSWER: actual answer here</think>";
      expect(extractCoTResponse(raw)).toBe("reasoning\nANSWER: actual answer here");
    });

    it("returns raw string when no think blocks exist", async () => {
      vi.resetModules();
      const { extractCoTResponse } = await import("@/lib/openai");
      expect(extractCoTResponse("plain answer")).toBe("plain answer");
    });

    it("uses last think block when multiple exist in Layout B", async () => {
      vi.resetModules();
      const { extractCoTResponse } = await import("@/lib/openai");
      const raw = "<think>first block</think><think>last block answer</think>";
      expect(extractCoTResponse(raw)).toBe("last block answer");
    });

    it("strips think block and returns trimmed meaningful text", async () => {
      vi.resetModules();
      const { extractCoTResponse } = await import("@/lib/openai");
      const raw = "<think>long reasoning step by step</think>  The real answer is here.  ";
      expect(extractCoTResponse(raw)).toBe("The real answer is here.");
    });
  });
});
