import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Stateless signed session token: `<expiresAtMs>.<hmac>`. No user data lives in the cookie. */
export const SESSION_COOKIE = "stockpile_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MIN_SECRET_LENGTH = 32;

const sign = (secret: string, payload: string) => createHmac("sha256", secret).update(payload).digest("hex");

export function createSessionToken(secret: string, now: number = Date.now(), ttlMs: number = SESSION_TTL_MS): string {
  const expires = String(now + ttlMs);
  return `${expires}.${sign(secret, expires)}`;
}

export function verifySessionToken(secret: string, token: string | undefined, now: number = Date.now()): boolean {
  if (!token) return false;
  const [expires, mac, ...rest] = token.split(".");
  if (!expires || !mac || rest.length > 0 || !/^\d+$/.test(expires)) return false;
  const expected = Buffer.from(sign(secret, expires));
  const given = Buffer.from(mac);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return false;
  return Number(expires) > now;
}

/** Constant-time password check. Hashing first equalises lengths so nothing leaks through them. */
export function passwordMatches(given: string, expected: string): boolean {
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(given), h(expected));
}

/** Only allow same-site relative redirects after login (blocks open redirects like //evil.com). */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
}
