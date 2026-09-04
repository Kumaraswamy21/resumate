import { createGoogleGenerativeAI } from "@ai-sdk/google";

import type { LanguageModel } from "ai";

/**
 * Returns the configured Gemini language model.
 * Set GOOGLE_GENERATIVE_AI_API_KEY and optionally AI_MODEL in .env.local.
 */
export function getModel(): LanguageModel {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY is not set. Copy .env.example to .env.local.",
    );
  }

  const google = createGoogleGenerativeAI({ apiKey });
  return google(process.env.AI_MODEL ?? "gemini-2.0-flash");
}
