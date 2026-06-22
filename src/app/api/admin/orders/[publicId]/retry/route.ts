import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession, unauthorizedResponse } from "@/lib/admin/require";
import { fulfillOrderByPublicId } from "@/lib/orders/fulfill-fazer";

type Params = { params: Promise<{ publicId: string }> };

export async function POST(_request: Request, { params }: Params) {
  if (!(await requireAdminSession())) return unauthorizedResponse();

  const { publicId } = await params;
  const order = await db.order.findUnique({ where: { publicId } });
  if (!order) {
    return NextResponse.json({ error: "order not found" }, { status: 404 });
  }

  if (!["PAID", "PROCESSING", "FAILED"].includes(order.status)) {
    return NextResponse.json({ error: "invalid order status" }, { status: 400 });
  }

  if (order.status === "FAILED") {
    await db.order.update({
      where: { id: order.id },
      data: { status: "PAID", errorMessage: null },
    });
  }

  try {
    await fulfillOrderByPublicId(publicId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "retry failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
