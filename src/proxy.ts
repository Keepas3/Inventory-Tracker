import { NextResponse, type NextRequest } from "next/server";
import { getAccessPolicy } from "@/lib/access";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * Optimistic gate in front of every page and API route: private mode needs a valid session cookie.
 * Server actions and API handlers re-check (see lib/auth.ts), so this is a convenience, not the only defence.
 */
export function proxy(request: NextRequest) {
  const policy = getAccessPolicy(process.env);

  if (policy.kind === "demo" || policy.kind === "open") return NextResponse.next();
  if (policy.kind === "locked") return new NextResponse(`Server misconfigured. ${policy.reason}`, { status: 503 });

  const { pathname, search } = request.nextUrl;
  // The cron endpoint authenticates itself with a bearer secret instead of a browser session.
  if (pathname === "/login" || pathname.startsWith("/api/cron/")) return NextResponse.next();

  if (verifySessionToken(process.env.SESSION_SECRET!, request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
