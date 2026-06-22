import type { Order, Prisma } from "@prisma/client";
import { fazerRequest } from "@/lib/fazercards/client";
import { db } from "@/lib/db";
import { sendOrderStatusEmail } from "@/lib/email/send";

type FazerOrderResponse = {
  ok: boolean;
  order?: { id?: string; status?: string; code?: string; codes?: string[]; cards?: unknown[] } & Record<
    string,
    unknown
  >;
};

async function applyFazerResult(orderId: string, res: FazerOrderResponse) {
  const fazerOrderId = res.order?.id ? String(res.order.id) : undefined;
  const deliveryData = res.order ?? undefined;
  const status = String(res.order?.status ?? "").toLowerCase();

  if (status === "completed") {
    const updated = await db.order.update({
      where: { id: orderId },
      data: {
        fazerOrderId,
        deliveryData: deliveryData as Prisma.InputJsonValue,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
    await sendOrderStatusEmail(updated).catch(console.error);
    return;
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      fazerOrderId,
      deliveryData: deliveryData as Prisma.InputJsonValue,
      status: "PROCESSING",
    },
  });
}

export async function fulfillOrderAtFazer(order: Order): Promise<void> {
  if (order.fazerOrderId && order.status === "COMPLETED") return;
  if (order.status !== "PAID" && order.status !== "PROCESSING") return;

  await db.order.update({
    where: { id: order.id },
    data: { status: "PROCESSING" },
  });

  const meta = (order.metadata ?? {}) as Record<string, unknown>;

  try {
    let res: FazerOrderResponse;

    switch (order.type) {
      case "STEAM":
        res = await fazerRequest("POST", "/steam-topup/order", {
          body: {
            steamLogin: meta.steamLogin,
            currency: "RUB",
            amount: meta.walletAmountRub,
          },
          idempotencyKey: order.idempotencyKey,
        });
        break;

      case "TELEGRAM_STARS":
        res = await fazerRequest("POST", "/telegram/stars/buy", {
          body: {
            telegram_username: meta.telegramUsername,
            quantity: meta.quantity,
          },
          idempotencyKey: order.idempotencyKey,
        });
        break;

      case "TELEGRAM_PREMIUM":
        res = await fazerRequest("POST", "/telegram/premium/buy", {
          body: {
            telegram_username: meta.telegramUsername,
            months: meta.months,
          },
          idempotencyKey: order.idempotencyKey,
        });
        break;

      case "GIFT_CARD":
        res = await fazerRequest("POST", "/giftcards/order", {
          body: {
            category_id: meta.categoryId,
            card_id: meta.cardId,
            quantity: 1,
          },
          idempotencyKey: order.idempotencyKey,
        });
        break;

      case "TOPUP":
        res = await fazerRequest("POST", "/topups/order", {
          body: {
            category_id: meta.categoryId,
            offer_id: meta.offerId,
            fields: meta.fields,
          },
          idempotencyKey: order.idempotencyKey,
        });
        break;

      case "GAME_KEY":
        res = await fazerRequest("POST", "/gamekeys/order", {
          body: {
            category_id: meta.categoryId,
            card_id: meta.cardId,
            quantity: 1,
          },
          idempotencyKey: order.idempotencyKey,
        });
        break;

      default:
        throw new Error(`Fulfillment not implemented for ${order.type}`);
    }

    await applyFazerResult(order.id, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : "FazerCards fulfillment failed";
    const failed = await db.order.update({
      where: { id: order.id },
      data: { status: "FAILED", errorMessage: message },
    });
    await sendOrderStatusEmail(failed).catch(console.error);
    throw err;
  }
}

export async function fulfillOrderByPublicId(publicId: string): Promise<void> {
  const order = await db.order.findUnique({ where: { publicId } });
  if (!order) throw new Error("Order not found");
  await fulfillOrderAtFazer(order);
}

export async function markOrderCompletedFromWebhook(
  publicIdOrFazerId: string,
  deliveryData: object,
): Promise<void> {
  const order =
    (await db.order.findFirst({ where: { fazerOrderId: publicIdOrFazerId } })) ??
    (await db.order.findUnique({ where: { publicId: publicIdOrFazerId } }));

  if (!order) return;

  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      status: "COMPLETED",
      deliveryData: deliveryData as Prisma.InputJsonValue,
      completedAt: new Date(),
    },
  });
  await sendOrderStatusEmail(updated).catch(console.error);
}
