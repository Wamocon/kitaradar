import OpenAI from "openai";

// Self-hosted AI "MAX" (OpenAI-compatible API).
// Configure via environment variables:
//   MAX_BASE_URL  — e.g. http://192.168.178.62:3000/v1
//   MAX_API_KEY   — optional; leave empty if the server requires no auth
//   MAX_MODEL     — model name, e.g. "llama3" (default)
const MAX_BASE_URL = process.env.MAX_BASE_URL;

if (!MAX_BASE_URL) {
  console.warn("MAX_BASE_URL is not set — AI features will be unavailable.");
}

export const openai = MAX_BASE_URL
  ? new OpenAI({
      baseURL: MAX_BASE_URL,
      // Some OpenAI-compat servers reject requests with an empty apiKey string;
      // use a placeholder when no key is configured.
      apiKey: process.env.MAX_API_KEY || "no-key-required",
    })
  : null;
