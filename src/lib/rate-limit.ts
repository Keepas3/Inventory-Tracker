/**
 * Minimal fixed-window rate limiter, in memory. Good enough to cap AI spend for a single-instance
 * deployment; swap for a shared store (Redis/Upstash) if the app is ever scaled horizontally.
 */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return function check(key: string): { ok: boolean; retryAfterSec: number } {
    const t = now();
    // Opportunistic cleanup so the map can't grow without bound.
    if (hits.size > 1000) for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);

    const entry = hits.get(key);
    if (!entry || entry.resetAt <= t) {
      hits.set(key, { count: 1, resetAt: t + windowMs });
      return { ok: true, retryAfterSec: 0 };
    }
    if (entry.count >= limit) return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - t) / 1000) };
    entry.count++;
    return { ok: true, retryAfterSec: 0 };
  };
}
