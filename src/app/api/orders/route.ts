import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { placeOrder } from "@/lib/orders/place-order";
import { createOrderSchema } from "@/lib/orders/schemas";
import { resolveFreekassaClientIp } from "@/lib/payments/freekassa-api";
import { getFreekassaConfigStatus } from "@/lib/payments/freekassa";
import { DEFAULT_FREEKASSA_METHOD_ID } from "@/lib/payments/freekassa-methods";

function clientIp(request: NextRequest): string {
  const raw =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return resolveFreekassaClientIp(raw ?? undefined);
}

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const paymentMethodId =
    typeof raw === "object" &&
    raw !== null &&
    "paymentMethodId" in raw &&
    typeof (raw as { paymentMethodId: unknown }).paymentMethodId === "number"
      ? (raw as { paymentMethodId: number }).paymentMethodId
      : DEFAULT_FREEKASSA_METHOD_ID;

  try {
    const result = await placeOrder(body, {
      clientIp: clientIp(request),
      paymentMethodId,
      extraMetadata: { source: "web" },
    });

    if (!result.paymentUrl) {
      const fk = getFreekassaConfigStatus();
      const hint = fk.missing.length
        ? `Не заданы переменные: ${fk.missing.join(", ")}`
        : "Freekassa API не вернул ссылку на оплату";
      return NextResponse.json(
        {
          ...result,
          error: "Оплата временно недоступна. Попробуйте позже или напишите в поддержку.",
          hint,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Order failed";
    if (msg === "STEAM_LOGIN_INVALID") {
      return NextResponse.json({ error: "Steam login cannot be refilled" }, { status: 400 });
    }
    if (msg === "OFFER_NOT_FOUND") {
      return NextResponse.json({ error: "Product not available" }, { status: 404 });
    }
    if (msg === "FAZER_NOT_CONFIGURED") {
      return NextResponse.json({ error: "Сервис временно недоступен" }, { status: 503 });
    }
    console.error("[orders]", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 502 });
  }
}
