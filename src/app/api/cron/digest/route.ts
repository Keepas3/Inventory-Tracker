import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { buildDigest } from "@/lib/digest";
import { listEvents, listItems } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function sendEmail(subject: string, html: string, text: string) {
  const { RESEND_API_KEY, DIGEST_TO, DIGEST_FROM } = process.env;
  if (!RESEND_API_KEY || !DIGEST_TO || !DIGEST_FROM) return { sent: false as const, reason: "email not configured" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: DIGEST_FROM, to: DIGEST_TO, subject, html, text }),
  });
  return res.ok ? { sent: true as const } : { sent: false as const, reason: `email provider returned ${res.status}` };
}

/** Invoked weekly by the scheduler (see vercel.json). `?dry=1` builds the digest without sending. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [items, events] = await Promise.all([listItems(), listEvents()]);
  const digest = buildDigest(items, events);
  const { html, text, subject, isEmpty } = digest;

  const dry = new URL(request.url).searchParams.get("dry") === "1";
  const delivery = dry ? { sent: false as const, reason: "dry run" } : isEmpty ? { sent: false as const, reason: "nothing to report" } : await sendEmail(subject, html, text);
  return NextResponse.json({ subject, text, attention: digest.attention.length, restock: digest.restock.length, delivery });
}
