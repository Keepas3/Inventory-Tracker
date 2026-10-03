import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getAccess } from "@/lib/auth";
import { safeNext } from "@/lib/session";

export const metadata = { title: "Sign in — Stockpile" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { policy, session } = await getAccess();
  const raw = (await searchParams).next;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw);
  // Nothing to sign in to (demo/open), or already signed in.
  if (policy.kind !== "login" || session) redirect(next);

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-20">
      <h1 className="mb-1 text-2xl font-semibold">Stockpile</h1>
      <p className="mb-6 text-sm text-zinc-500">Private inventory. Sign in to continue.</p>
      <LoginForm next={next} />
    </main>
  );
}
