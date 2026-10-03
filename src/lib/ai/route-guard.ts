import "server-only";
import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/rate-limit";
import { isAiConfigured } from "./config";

type Limiter = ReturnType<typeof createRateLimiter>;

export const extractLimiter = createRateLimiter(10, 60 * 60 * 1000);
export const askLimiter = createRateLimiter(30, 60 * 60 * 1000);

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Returns an error response if AI is unavailable or the caller is over their limit, otherwise null. */
export function guard(request: Request, limiter: Limiter): NextResponse | null {
  if (!isAiConfigured()) {
    return NextResponse.json({ error: "AI features are not configured on this server (missing ANTHROPIC_API_KEY)." }, { status: 503 });
  }
  const { ok, retryAfterSec } = limiter(clientKey(request));
  if (!ok) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${Math.ceil(retryAfterSec / 60)} min.` },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }
  return null;
}
