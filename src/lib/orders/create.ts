import { nanoid } from "nanoid";
import type { OrderType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { generatePublicOrderId } from "@/lib/pricing";
import { createFreekassaCheckout } from "@/lib/payments/freekassa-checkout";
import { isFreekassaConfigured } from "@/lib/payments/freekassa";
import { DEFAULT_FREEKASSA_METHOD_ID } from "@/lib/payments/freekassa-methods";

export type CreateOrderParams = {
  orderType: OrderType;
  email: string;
  totalAmountRub: number;
  amountUsd: number;
  metadata: Record<string, unknown>;
  paymentMethodId?: number;
  clientIp?: string;
};

export async function createOrderWithPayment(input: CreateOrderParams) {
  const publicId = generatePublicOrderId();
  const idempotencyKey = nanoid(24);

  const result = await db.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        amount: input.totalAmountRub,
        status: "PENDING",
      },
    });

    const order = await tx.order.create({
      data: {
        publicId,
        email: input.email.toLowerCase().trim(),
        type: input.orderType,
        status: "PENDING_PAYMENT",
        amountRub: input.totalAmountRub,
        amountUsd: input.amountUsd,
        idempotencyKey,
        paymentId: payment.id,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });

    return { order, payment };
  });

  let paymentUrl: string | null = null;
  if (isFreekassaConfigured()) {
    const fk = await createFreekassaCheckout({
      paymentId: result.order.publicId,
      amountRub: Number(result.order.amountRub),
      email: result.order.email,
      ip: input.clientIp ?? "127.0.0.1",
      paymentMethodId: input.paymentMethodId ?? DEFAULT_FREEKASSA_METHOD_ID,
    });
    paymentUrl = fk.paymentUrl;
    if (fk.fkOrderId) {
      await db.payment.update({
        where: { id: result.payment.id },
        data: { freekassaOrderId: String(fk.fkOrderId) },
      });
    }
  }

  return {
    orderId: result.order.publicId,
    internalId: result.order.id,
    paymentUrl,
    freekassaConfigured: isFreekassaConfigured(),
  };
}

export async function getOrderByPublicId(publicId: string) {
  return db.order.findUnique({
    where: { publicId },
    include: { payment: true },
  });
}

export async function getOrdersByEmail(email: string, limit = 20) {
  return db.order.findMany({
    where: { email: email.toLowerCase().trim() },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { payment: true },
  });
}
