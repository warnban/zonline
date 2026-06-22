import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, unauthorizedResponse } from "@/lib/admin/require";
import { updatePricingSettings } from "@/lib/settings";

const schema = z.object({
  usdRubRate: z.number().positive().max(500),
  defaultMarkupPct: z.number().min(0).max(100),
  steamCommissionPct: z.number().min(0).max(100),
  steamFixedFeeRub: z.number().min(0).max(10_000),
});

export async function PUT(request: Request) {
  if (!(await requireAdminSession())) return unauthorizedResponse();

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  await updatePricingSettings(parsed.data);
  return NextResponse.json({ ok: true });
}
