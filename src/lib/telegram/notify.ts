import { env } from "@/lib/env";
import type { Order } from "@prisma/client";

type OrderMeta = {
  telegramChatId?: number;
  source?: string;
};

export function telegramBotEmail(telegramUserId: number | string): string {
  return `${telegramUserId}@telegram.org`;
}

export async function notifyTelegramOrderUpdate(
  order: Order,
  text: string,
): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  const meta = (order.metadata ?? {}) as OrderMeta;
  const chatId = meta.telegramChatId;
  if (!chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  }).catch(console.error);
}

export async function notifyTelegramOrderPaid(order: Order): Promise<void> {
  const appUrl = env.APP_URL.replace(/\/$/, "");
  await notifyTelegramOrderUpdate(
    order,
    `✅ <b>Оплата получена</b>\nЗаказ <code>${order.publicId}</code>\nСтатус выполняется…\n\n<a href="${appUrl}/order/${order.publicId}">Открыть заказ</a>`,
  );
}

export async function notifyTelegramOrderCompleted(order: Order): Promise<void> {
  const appUrl = env.APP_URL.replace(/\/$/, "");
  await notifyTelegramOrderUpdate(
    order,
    `🎉 <b>Заказ выполнен</b>\n<code>${order.publicId}</code>\n\n<a href="${appUrl}/order/${order.publicId}">Детали заказа</a>`,
  );
}
