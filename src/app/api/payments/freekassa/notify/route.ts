import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { fulfillOrderAtFazer } from "@/lib/orders/fulfill-fazer";
import { sendOrderStatusEmail } from "@/lib/email/send";
import { notifyTelegramOrderPaid } from "@/lib/telegram/notify";
import {
  amountsMatch,
  isFreekassaNotifyIp,
  parseFreekassaPayload,
  verifyFreekassaNotificationSign,
} from "@/lib/payments/freekassa";

export const runtime = "nodejs";

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "127.0.0.1"
  );
}

async function readPayload(request: NextRequest): Promise<Record<string, string>> {
  if (request.method === "GET") {
    const out: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, string>;
  }

  const form = await request.formData();
  const out: Record<string, string> = {};
  form.forEach((v, k) => {
    out[k] = String(v);
  });
  return out;
}

async function handleNotify(request: NextRequest) {
  const ip = clientIp(request);

  if (process.env.NODE_ENV === "production" && !isFreekassaNotifyIp(ip)) {
    return new NextResponse("hacking attempt!", { status: 403 });
  }

  const raw = await readPayload(request);
  const notification = parseFreekassaPayload(raw);

  const log = await db.webhookLog.create({
    data: {
      source: "freekassa",
      event: notification ? "payment.notify" : "payment.notify.invalid",
      payload: { ...raw, _ip: ip },
      processed: false,
    },
  });

  if (!notification) {
    return new NextResponse("invalid payload", { status: 400 });
  }

  if (env.FREEKASSA_MERCHANT_ID && notification.merchantId !== env.FREEKASSA_MERCHANT_ID) {
    return new NextResponse("wrong merchant", { status: 403 });
  }

  if (!env.FREEKASSA_SECRET_2) {
    return new NextResponse("not configured", { status: 503 });
  }

  if (!verifyFreekassaNotificationSign(notification, env.FREEKASSA_SECRET_2)) {
    await db.webhookLog.update({
      where: { id: log.id },
      data: { error: "wrong sign" },
    });
    return new NextResponse("wrong sign", { status: 403 });
  }

  const order = await db.order.findFirst({
    where: { publicId: notification.merchantOrderId },
    include: { payment: true },
  });

  if (!order) {
    await db.webhookLog.update({
      where: { id: log.id },
      data: { error: "order not found" },
    });
    return new NextResponse("order not found", { status: 404 });
  }

  const expectedRub = Number(order.amountRub);
  if (!amountsMatch(expectedRub, notification.amount)) {
    await db.webhookLog.update({
      where: { id: log.id },
      data: { error: `amount mismatch: ${notification.amount} vs ${expectedRub}` },
    });
    return new NextResponse("wrong amount", { status: 400 });
  }

  if (order.payment) {
    await db.payment.update({
      where: { id: order.payment.id },
      data: {
        status: "PAID",
        freekassaOrderId: notification.intId || order.payment.freekassaOrderId,
        callbackData: notification.raw,
      },
    });
  }

  const alreadyPaid = order.status !== "PENDING_PAYMENT";

  if (!alreadyPaid) {
    const paid = await db.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
    });
    await sendOrderStatusEmail(paid).catch(console.error);
    await notifyTelegramOrderPaid(paid).catch(console.error);
  }

  const fresh = await db.order.findUnique({ where: { id: order.id } });
  if (
    fresh &&
    !fresh.fazerOrderId &&
    fresh.status !== "COMPLETED" &&
    fresh.status !== "FAILED"
  ) {
    try {
      await fulfillOrderAtFazer(fresh);
    } catch (err) {
      console.error("[freekassa] fulfill after pay:", err);
    }
  }

  await db.webhookLog.update({
    where: { id: log.id },
    data: { processed: true },
  });

  return new NextResponse("YES", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: NextRequest) {
  try {
    return await handleNotify(request);
  } catch (err) {
    console.error("[freekassa notify]", err);
    return new NextResponse("error", { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    return await handleNotify(request);
  } catch (err) {
    console.error("[freekassa notify]", err);
    return new NextResponse("error", { status: 500 });
  }
}
