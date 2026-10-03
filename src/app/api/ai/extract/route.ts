import { NextResponse } from "next/server";
import { toCandidateRows } from "@/lib/ai/candidates";
import { ACCEPTED_IMAGE_TYPES, extractItemsFromImage, type AcceptedImageType } from "@/lib/ai/extract";
import { extractLimiter, guard } from "@/lib/ai/route-guard";

const MAX_BYTES = 4 * 1024 * 1024; // the client downsizes first; this is the server-side backstop

export async function POST(request: Request) {
  const blocked = await guard(request, extractLimiter);
  if (blocked) return blocked;

  const form = await request.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "Attach an image in the `image` field." }, { status: 400 });
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as AcceptedImageType)) {
    return NextResponse.json({ error: "Unsupported image type. Use JPEG, PNG, WebP or GIF." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is too large (max 4 MB)." }, { status: 413 });

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const result = await extractItemsFromImage(base64, file.type as AcceptedImageType);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });

  const defaultLocation = (form?.get("location") as string | null)?.trim().slice(0, 60) || "Unsorted";
  return NextResponse.json({ rows: toCandidateRows(result.extraction, defaultLocation), warnings: result.extraction.warnings });
}
