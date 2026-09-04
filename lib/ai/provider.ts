import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * Returns the configured Vercel AI SDK language model.
 * Set AI_PROVIDER and AI_MODEL in the environment.
 */
export function getModel(): LanguageModel {
  const provider = process.env.AI_PROVIDER;
  const modelId = process.env.AI_MODEL ?? "gpt-4o";

  if (provider === "openai") {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    return openai(modelId);
  }

  // Anthropic (uncomment when @ai-sdk/anthropic is installed):
  // if (provider === 'anthropic') {
  //   const { createAnthropic } = await import('@ai-sdk/anthropic');
  //   const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  //   return anthropic(modelId);
  // }

  // Google (uncomment when @ai-sdk/google is installed):
  // if (provider === 'google') {
  //   const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
  //   const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
  //   return google(modelId);
  // }

  throw new Error("Unsupported AI_PROVIDER");
}
