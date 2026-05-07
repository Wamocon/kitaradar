import OpenAI from "openai";

/**
 * Task types for automatic model routing.
 *
 * The app calls `getModel(taskType)` and receives the optimal model name
 * for that task — configured via environment variables, so models can be
 * swapped without touching application code.
 *
 * | Task              | Model env var              | Use case                         |
 * |-------------------|----------------------------|----------------------------------|
 * | "default"         | MAX_AI_MODEL_DEFAULT       | Recommendations, general chat    |
 * | "reasoning"       | MAX_AI_MODEL_REASONING     | Complex advice, deep analysis    |
 * | "tools"           | MAX_AI_MODEL_TOOLS         | JSON extraction, tool-calling    |
 * | "vision"          | MAX_AI_MODEL_VISION        | Image / OCR understanding        |
 * | "embedding"       | MAX_AI_MODEL_EMBEDDING     | Semantic search & similarity     |
 */
export type AiTaskType = "default" | "reasoning" | "tools" | "vision" | "embedding";

const MODEL_MAP: Record<AiTaskType, string | undefined> = {
  default: process.env.MAX_AI_MODEL_DEFAULT,
  reasoning: process.env.MAX_AI_MODEL_REASONING,
  tools: process.env.MAX_AI_MODEL_TOOLS,
  vision: process.env.MAX_AI_MODEL_VISION,
  embedding: process.env.MAX_AI_MODEL_EMBEDDING,
};

const FALLBACK_MODEL = "qwen3.6:35b";

/**
 * Returns the configured model name for the given task type.
 * Falls back to `MAX_AI_MODEL_DEFAULT` and then to a hardcoded default
 * so the app never crashes due to a missing env variable.
 */
export function getModel(task: AiTaskType = "default"): string {
  return MODEL_MAP[task] ?? MODEL_MAP.default ?? FALLBACK_MODEL;
}

// ---------------------------------------------------------------------------
// OpenAI-compatible client pointing to the self-hosted MAX / LiteLLM gateway.
// ---------------------------------------------------------------------------
const MAX_AI_BASE_URL = process.env.MAX_AI_BASE_URL;

if (!MAX_AI_BASE_URL) {
  console.warn("MAX_AI_BASE_URL is not set — AI features will be unavailable.");
}

export const openai = MAX_AI_BASE_URL
  ? new OpenAI({
      baseURL: MAX_AI_BASE_URL,
      // LiteLLM rejects requests without an API key, even when auth is relaxed.
      apiKey: process.env.MAX_AI_API_KEY ?? "no-key-required",
    })
  : null;
