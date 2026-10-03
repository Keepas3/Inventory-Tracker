import { NextResponse } from "next/server";
import { z } from "zod";
import { askInventory } from "@/lib/ai/ask";
import { askLimiter, guard } from "@/lib/ai/route-guard";

const bodySchema = z.object({ question: z.string().trim().min(1).max(500) });

export async function POST(request: Request) {
  const blocked = guard(request, askLimiter);
  if (blocked) return blocked;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Send { question } (1–500 characters)." }, { status: 400 });

  const result = await askInventory(parsed.data.question);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ answer: result.answer });
}
