import { MIN_SECRET_LENGTH } from "./session";

/**
 * Deployment modes (APP_MODE):
 *  - "private" (default): login required for everything; full read/write once signed in.
 *  - "demo": public and read-only, intended for a seeded portfolio deployment. No login, no writes.
 * Pure (env passed in) so the rules are unit-testable and shared by the proxy and server code.
 */
export type AppMode = "private" | "demo";

export interface AccessEnv {
  APP_MODE?: string;
  AUTH_PASSWORD?: string;
  SESSION_SECRET?: string;
  NODE_ENV?: string;
}

export type AccessPolicy =
  | { kind: "demo" } // anyone reads, nobody writes
  | { kind: "login" } // must hold a valid session
  | { kind: "open" } // local dev with auth unconfigured: everything allowed
  | { kind: "locked"; reason: string }; // production but misconfigured: refuse everything

export function getAccessPolicy(env: AccessEnv): AccessPolicy {
  if (env.APP_MODE === "demo") return { kind: "demo" };
  if (env.APP_MODE && env.APP_MODE !== "private") return { kind: "locked", reason: `Unknown APP_MODE "${env.APP_MODE}".` };

  const configured = Boolean(env.AUTH_PASSWORD) && (env.SESSION_SECRET?.length ?? 0) >= MIN_SECRET_LENGTH;
  if (configured) return { kind: "login" };
  if (env.NODE_ENV === "production") {
    return { kind: "locked", reason: `Set AUTH_PASSWORD and a SESSION_SECRET of at least ${MIN_SECRET_LENGTH} characters, or set APP_MODE=demo.` };
  }
  return { kind: "open" };
}

export const canWrite = (policy: AccessPolicy, hasSession: boolean) =>
  policy.kind === "open" || (policy.kind === "login" && hasSession);
