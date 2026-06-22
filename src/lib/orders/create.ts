import { nanoid } from "nanoid";
import type { OrderType, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { generatePublicOrderId } from "@/lib/pricing";
import { buildFreekassaPaymentUrl, isFreekassaConfigured } from "@/lib/payments/freekassa";

export type CreateOrderParams = {
  orderType: OrderType;
  email: string;
  totalAmountRub: number;
  amountUsd: number;
  metadata: Record<string, unknown>;
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
    paymentUrl = buildFreekassaPaymentUrl({
      orderId: result.order.publicId,
      amountRub: Number(result.order.amountRub),
      email: result.order.email,
    });
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
