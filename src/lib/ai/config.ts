import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-5-5";

// Opt-in server-side retry on a substitute model if the safety classifiers decline a request.
export const FALLBACK_BETAS = ["server-side-fallback-2026-07-01"];

/** Credentials come from ANTHROPIC_API_KEY (set in .env.local); never exposed to the browser. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | undefined;
export function getClient(): Anthropic {
  client ??= new Anthropic();
  return client;
}
