import { createFreekassaApiOrder } from "@/lib/payments/freekassa-api";
import {
  buildFreekassaPaymentUrl,
  isFreekassaApiConfigured,
  isFreekassaSciConfigured,
} from "@/lib/payments/freekassa";
import { DEFAULT_FREEKASSA_METHOD_ID } from "@/lib/payments/freekassa-methods";

export type FreekassaCheckoutInput = {
  paymentId: string;
  amountRub: number;
  email: string;
  ip: string;
  paymentMethodId?: number;
};

export type FreekassaCheckoutResult = {
  paymentUrl: string;
  mode: "sci" | "api";
  fkOrderId?: number;
};

/**
 * Создаёт ссылку на оплату.
 * SCI (pay.fk.money + i=44/36/…) — прямой СБП/карта по докам Freekassa §1.3.
 * API orders/create на многих магазинах отдаёт pay.freekassa.net / fmt.me → FK Wallet.
 */
export async function createFreekassaCheckout(
  input: FreekassaCheckoutInput,
): Promise<FreekassaCheckoutResult> {
  const paymentMethodId = input.paymentMethodId ?? DEFAULT_FREEKASSA_METHOD_ID;

  if (isFreekassaSciConfigured()) {
    return {
      mode: "sci",
      paymentUrl: buildFreekassaPaymentUrl({
        orderId: input.paymentId,
        amountRub: input.amountRub,
        email: input.email,
        paymentMethodId,
      }),
    };
  }

  if (isFreekassaApiConfigured()) {
    const fk = await createFreekassaApiOrder({
      paymentId: input.paymentId,
      amountRub: input.amountRub,
      email: input.email,
      ip: input.ip,
      paymentMethodId,
    });
    return {
      mode: "api",
      paymentUrl: fk.paymentUrl,
      fkOrderId: fk.fkOrderId,
    };
  }

  throw new Error("Freekassa is not configured");
}
