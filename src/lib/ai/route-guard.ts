import "server-only";
import { NextResponse } from "next/server";
import { getAccess } from "@/lib/auth";
import { createRateLimiter } from "@/lib/rate-limit";
import { isAiConfigured } from "./config";

type Limiter = ReturnType<typeof createRateLimiter>;

// Public demo deployments get tighter per-client limits. Everyone shares a global daily ceiling,
// so total AI spend is bounded no matter how many clients (or spoofed IPs) show up.
const demo = process.env.APP_MODE === "demo";
const HOUR = 60 * 60 * 1000;
export const extractLimiter = createRateLimiter(demo ? 3 : 10, HOUR);
export const askLimiter = createRateLimiter(demo ? 15 : 30, HOUR);
const dailyCap = createRateLimiter(Number(process.env.AI_DAILY_LIMIT) || 300, 24 * HOUR);

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Returns an error response if the caller may not use AI right now, otherwise null. */
export async function guard(request: Request, limiter: Limiter): Promise<NextResponse | null> {
  // Defence in depth: the proxy already gates private mode, but API handlers verify for themselves.
  const { policy, session } = await getAccess();
  if (policy.kind === "locked" || (policy.kind === "login" && !session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAiConfigured()) {
    return NextResponse.json({ error: "AI features are not configured on this server (missing ANTHROPIC_API_KEY)." }, { status: 503 });
  }

  const perClient = limiter(clientKey(request));
  if (!perClient.ok) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${Math.ceil(perClient.retryAfterSec / 60)} min.` },
      { status: 429, headers: { "Retry-After": String(perClient.retryAfterSec) } },
    );
  }
  if (!dailyCap("global").ok) {
    return NextResponse.json({ error: "The AI daily budget for this deployment has been used up. Try again tomorrow." }, { status: 429 });
  }
  return null;
}
