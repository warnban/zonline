import { NextRequest, NextResponse } from "next/server";
import { parseWebhookEvent, type WebhookEvent } from "fazercards";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { markOrderCompletedFromWebhook } from "@/lib/orders/fulfill-fazer";
import { sendOrderStatusEmail } from "@/lib/email/send";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-fazercards-signature") ?? "";

  if (!env.FAZER_WEBHOOK_SECRET) {
    await db.webhookLog.create({
      data: {
        source: "fazercards",
        event: "unknown",
        payload: { error: "webhook secret not configured" },
        processed: false,
        error: "FAZER_WEBHOOK_SECRET missing",
      },
    });
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let event: WebhookEvent;
  try {
    event = parseWebhookEvent(rawBody, signature, env.FAZER_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid webhook";
    await db.webhookLog.create({
      data: {
        source: "fazercards",
        event: "signature_failed",
        payload: { raw: rawBody.slice(0, 500) },
        processed: false,
        error: message,
      },
    });
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const log = await db.webhookLog.create({
    data: {
      source: "fazercards",
      event: event.type,
      payload: event as object,
      processed: false,
    },
  });

  try {
    await handleFazerWebhook(event);
    await db.webhookLog.update({
      where: { id: log.id },
      data: { processed: true },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "processing failed";
    await db.webhookLog.update({
      where: { id: log.id },
      data: { error: message },
    });
    console.error("[fazercards webhook]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

async function handleFazerWebhook(event: WebhookEvent) {
  const fazerOrderId = event.order?.id;
  if (!fazerOrderId) return;

  const order = await db.order.findFirst({
    where: { fazerOrderId: String(fazerOrderId) },
  });
  if (!order) return;

  switch (event.type) {
    case "order.completed":
      await markOrderCompletedFromWebhook(String(fazerOrderId), event.order as object);
      break;
    case "order.failed": {
      const updated = await db.order.update({
        where: { id: order.id },
        data: {
          status: "FAILED",
          errorMessage: event.reason ?? "Order failed",
          deliveryData: event.order as object,
        },
      });
      await sendOrderStatusEmail(updated).catch(console.error);
      break;
    }
    case "order.refunded":
      await db.order.update({
        where: { id: order.id },
        data: {
          status: "REFUNDED",
          deliveryData: event.order as object,
        },
      });
      break;
  }
}
