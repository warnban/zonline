import { env } from "@/lib/env";
import type { Order } from "@prisma/client";
import { formatRub } from "@/lib/pricing";
import { extractDeliveryCodes, formatDeliveryCodesHtml } from "@/lib/orders/delivery-codes";

const statusText: Record<string, string> = {
  PAID: "Оплачен, выполняется",
  PROCESSING: "В обработке",
  COMPLETED: "Выполнен",
  FAILED: "Ошибка выполнения",
  REFUNDED: "Возврат",
};

const codeOrderTypes = new Set(["GIFT_CARD", "GAME_KEY"]);

export async function sendOrderStatusEmail(order: Order): Promise<void> {
  if (!["PAID", "COMPLETED", "FAILED"].includes(order.status)) return;

  const subject = `Zynqo — заказ ${order.publicId}: ${statusText[order.status] ?? order.status}`;
  const orderUrl = `${env.APP_URL}/order/${order.publicId}`;

  let codesBlock = "";
  if (order.status === "COMPLETED" && codeOrderTypes.has(order.type) && order.deliveryData) {
    const codes = extractDeliveryCodes(order.deliveryData);
    codesBlock = formatDeliveryCodesHtml(codes);
  }

  const completionHint =
    order.status === "COMPLETED" && !codesBlock
      ? `<p>Пополнение выполнено. Проверьте аккаунт — код не требуется.</p>`
      : "";

  const html = `
    <p>Заказ <strong>${order.publicId}</strong></p>
    <p>Статус: ${statusText[order.status] ?? order.status}</p>
    <p>Сумма: ${formatRub(Number(order.amountRub))}</p>
    ${codesBlock}
    ${completionHint}
    <p><a href="${orderUrl}">Открыть статус заказа</a></p>
    ${order.errorMessage ? `<p>${order.errorMessage}</p>` : ""}
  `;

  await deliverEmail(order.email, subject, html);
}

async function deliverEmail(to: string, subject: string, html: string): Promise<void> {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend error", await res.text());
    }
    return;
  }

  console.log("[email:dev]", to, subject);
}
