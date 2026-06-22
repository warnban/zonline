import { NextResponse } from "next/server";
import { validateTopupId } from "@/lib/fazercards/validate";
import { isFazerConfigured } from "@/lib/fazercards/client";

export async function POST(request: Request) {
  if (!isFazerConfigured()) {
    return NextResponse.json({ ok: false, valid: null, skipped: true }, { status: 503 });
  }

  const body = await request.json();
  const categoryId = String(body.categoryId ?? "").trim();
  const offerId = String(body.offerId ?? "").trim();
  const fields = (body.fields ?? {}) as Record<string, string>;

  if (!categoryId || !offerId) {
    return NextResponse.json({ ok: false, error: "categoryId and offerId required" }, { status: 400 });
  }

  const result = await validateTopupId(categoryId, offerId, fields);
  return NextResponse.json({ ok: true, ...result });
}
