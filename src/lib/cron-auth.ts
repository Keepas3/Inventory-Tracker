import { timingSafeEqual } from "node:crypto";

/**
 * Bearer-secret check shared by the cron endpoints. Fails closed: an unset CRON_SECRET never means "open".
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically.
 */
export function isAuthorizedCron(request: Request, secret: string | undefined = process.env.CRON_SECRET): boolean {
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
