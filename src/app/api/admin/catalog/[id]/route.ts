import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession, unauthorizedResponse } from "@/lib/admin/require";
import { setCategoryEnabled } from "@/lib/catalog/sync";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ enabled: z.boolean() });

export async function PATCH(request: Request, { params }: Params) {
  if (!(await requireAdminSession())) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    await setCategoryEnabled(id, parsed.data.enabled);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
