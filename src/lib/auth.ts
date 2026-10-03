import "server-only";
import { cookies } from "next/headers";
import { canWrite, getAccessPolicy } from "./access";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/** Resolved on the server for the current request. Re-check here, not just in the proxy. */
export async function getAccess() {
  const policy = getAccessPolicy(process.env);
  const token = policy.kind === "login" ? (await cookies()).get(SESSION_COOKIE)?.value : undefined;
  const session = policy.kind === "login" && verifySessionToken(process.env.SESSION_SECRET!, token);
  return { policy, session, canWrite: canWrite(policy, session) };
}

/** Call first in every mutating server action. */
export async function requireWriter() {
  if (!(await getAccess()).canWrite) throw new Error("Read-only: you don't have permission to change data.");
}
