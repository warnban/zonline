import { NextResponse } from "next/server";
import { getOrdersByEmail } from "@/lib/orders/create";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const orders = await getOrdersByEmail(email);
  return NextResponse.json({
    items: orders.map((o) => ({
      publicId: o.publicId,
      status: o.status,
      type: o.type,
      amountRub: Number(o.amountRub),
      createdAt: o.createdAt.toISOString(),
    })),
  });
}
