import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { reseedDemo } from "@/lib/demo-seed";

export const dynamic = "force-dynamic";

/**
 * Daily: regenerates the demo dataset relative to today, so "expires in 12 days" and the usage charts stay true.
 * Destructive by design, so it is hard-gated to demo deployments and can never touch a private deployment's data.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (process.env.APP_MODE !== "demo") {
    return NextResponse.json({ error: "Only available when APP_MODE=demo." }, { status: 403 });
  }
  return NextResponse.json({ refreshed: await reseedDemo(new Date()) });
}
