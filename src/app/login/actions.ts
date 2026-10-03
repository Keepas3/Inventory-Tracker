"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAccessPolicy } from "@/lib/access";
import { createRateLimiter } from "@/lib/rate-limit";
import { createSessionToken, passwordMatches, safeNext, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/session";

export interface LoginState {
  error?: string;
}

// Slow down password guessing: 5 attempts per 15 minutes per client.
const loginLimiter = createRateLimiter(5, 15 * 60 * 1000);

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (getAccessPolicy(process.env).kind !== "login") return { error: "Login isn't enabled on this deployment." };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const { ok, retryAfterSec } = loginLimiter(ip);
  if (!ok) return { error: `Too many attempts. Try again in ${Math.ceil(retryAfterSec / 60)} min.` };

  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password, process.env.AUTH_PASSWORD!)) return { error: "Incorrect password." };

  (await cookies()).set(SESSION_COOKIE, createSessionToken(process.env.SESSION_SECRET!), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  redirect(safeNext(String(formData.get("next") ?? "")));
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
