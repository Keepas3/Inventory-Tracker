import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";
import { Card } from "@/components/ui";
import { getAccess } from "@/lib/auth";
import { safeNext } from "@/lib/session";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { policy, session } = await getAccess();
  const raw = (await searchParams).next;
  const next = safeNext(Array.isArray(raw) ? raw[0] : raw);
  // Nothing to sign in to (demo/open), or already signed in.
  if (policy.kind !== "login" || session) redirect(next);

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <Card className="p-6">
        <Logo className="mb-4 text-lg" />
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mb-6 mt-1 text-sm text-muted">This is a private inventory. Enter the password to continue.</p>
        <LoginForm next={next} />
      </Card>
    </main>
  );
}
