import { z } from "zod";

export const steamOrderSchema = z.object({
  type: z.literal("STEAM"),
  email: z.string().email(),
  steamLogin: z.string().min(1).max(64),
  walletAmountRub: z.number().int().min(100).max(500_000),
});

export const telegramStarsOrderSchema = z.object({
  type: z.literal("TELEGRAM_STARS"),
  email: z.string().email(),
  telegramUsername: z.string().min(1).max(64),
  quantity: z.number().int().min(50).max(10_000),
});

export const telegramPremiumOrderSchema = z.object({
  type: z.literal("TELEGRAM_PREMIUM"),
  email: z.string().email(),
  telegramUsername: z.string().min(1).max(64),
  months: z.union([z.literal(3), z.literal(6), z.literal(12)]),
});

export const giftCardOrderSchema = z.object({
  type: z.literal("GIFT_CARD"),
  email: z.string().email(),
  categoryId: z.string().min(1),
  cardId: z.string().min(1),
  productName: z.string().optional(),
});

export const topupOrderSchema = z.object({
  type: z.literal("TOPUP"),
  email: z.string().email(),
  categoryId: z.string().min(1),
  offerId: z.string().min(1),
  fields: z.record(z.string(), z.string()),
  productName: z.string().optional(),
});

export const gameKeyOrderSchema = z.object({
  type: z.literal("GAME_KEY"),
  email: z.string().email(),
  categoryId: z.string().min(1),
  cardId: z.string().min(1),
  productName: z.string().optional(),
});

export const createOrderSchema = z.discriminatedUnion("type", [
  steamOrderSchema,
  telegramStarsOrderSchema,
  telegramPremiumOrderSchema,
  giftCardOrderSchema,
  topupOrderSchema,
  gameKeyOrderSchema,
]);

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
