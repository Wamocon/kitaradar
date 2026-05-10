import OpenAI from "openai";
import type { ChatCompletionCreateParamsNonStreaming, ChatCompletion } from "openai/resources/chat/completions";

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

const FALLBACK_MODEL = "gemma4:31b";

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

/**
 * Creates a chat completion via the MAX / LiteLLM gateway.
 *
 * Always injects `enable_thinking: false` so that qwen3 CoT models
 * return their answer in `choices[0].message.content` rather than hiding it
 * inside stripped `<think>` blocks. Non-thinking models (e.g. gemma4) ignore
 * this parameter.
 *
 * Throws if the OpenAI client is not initialised (MAX_AI_BASE_URL missing).
 */
export async function createMaxCompletion(
  params: ChatCompletionCreateParamsNonStreaming
): Promise<ChatCompletion> {
  if (!openai) throw new Error("MAX AI client not initialised — check MAX_AI_BASE_URL");
  // Cast needed because `enable_thinking` is a LiteLLM extension not in the OpenAI spec.
  const extendedParams = { ...params, enable_thinking: false } as unknown as ChatCompletionCreateParamsNonStreaming;
  return openai.chat.completions.create(extendedParams);
}

/**
 * Robustly extracts the final answer from a CoT model response.
 *
 * Some models (e.g. qwen3 with thinking enabled) place their reasoning AND
 * their final answer inside one or more <think>…</think> blocks, leaving
 * nothing outside.  This helper handles both layouts:
 *
 *   Layout A (standard):  <think>…reasoning…</think>   actual answer here
 *   Layout B (all-in):    <think>…reasoning… ANSWER: actual answer</think>
 *
 * Strategy:
 *   1. Strip every <think>…</think> block — if meaningful text remains, use it.
 *   2. Otherwise fall back to the content of the LAST think block (Layout B).
 *   3. Otherwise return the raw string.
 */
export function extractCoTResponse(raw: string): string {
  const stripped = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (stripped.length > 10) return stripped;

  // Layout B: answer is inside the last think block
  const allThinkBlocks = [...raw.matchAll(/<think>([\s\S]*?)<\/think>/gi)];
  const lastBlock = allThinkBlocks.at(-1);
  if (lastBlock) return lastBlock[1].trim();

  return raw.trim();
}
