import type { OrderType } from "@prisma/client";
import type { CreateOrderBody } from "./schemas";

export type OrderBuildResult = {
  orderType: OrderType;
  totalAmountRub: number;
  amountUsd: number;
  metadata: Record<string, unknown>;
  label: string;
};

export function buildOrderFromBody(body: CreateOrderBody): OrderBuildResult {
  switch (body.type) {
    case "STEAM":
      return {
        orderType: "STEAM",
        totalAmountRub: 0, // calculated in route
        amountUsd: 0,
        metadata: {
          steamLogin: body.steamLogin.trim(),
          walletAmountRub: body.walletAmountRub,
        },
        label: `Steam ${body.steamLogin}`,
      };
    case "TELEGRAM_STARS":
      return {
        orderType: "TELEGRAM_STARS",
        totalAmountRub: 0,
        amountUsd: 0,
        metadata: {
          telegramUsername: normalizeUsername(body.telegramUsername),
          quantity: body.quantity,
        },
        label: `TG Stars ×${body.quantity}`,
      };
    case "TELEGRAM_PREMIUM":
      return {
        orderType: "TELEGRAM_PREMIUM",
        totalAmountRub: 0,
        amountUsd: 0,
        metadata: {
          telegramUsername: normalizeUsername(body.telegramUsername),
          months: body.months,
        },
        label: `TG Premium ${body.months} мес.`,
      };
    case "GIFT_CARD":
      return {
        orderType: "GIFT_CARD",
        totalAmountRub: 0,
        amountUsd: 0,
        metadata: {
          categoryId: body.categoryId,
          cardId: body.cardId,
          productName: body.productName,
        },
        label: body.productName ?? "Gift card",
      };
    case "TOPUP":
      return {
        orderType: "TOPUP",
        totalAmountRub: 0,
        amountUsd: 0,
        metadata: {
          categoryId: body.categoryId,
          offerId: body.offerId,
          fields: body.fields,
          productName: body.productName,
        },
        label: body.productName ?? "Top-up",
      };
    case "GAME_KEY":
      return {
        orderType: "GAME_KEY",
        totalAmountRub: 0,
        amountUsd: 0,
        metadata: {
          categoryId: body.categoryId,
          cardId: body.cardId,
          productName: body.productName,
        },
        label: body.productName ?? "Game key",
      };
  }
}

function normalizeUsername(u: string): string {
  return u.trim().replace(/^@/, "");
}
