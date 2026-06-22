import { createFreekassaApiOrder } from "@/lib/payments/freekassa-api";
import { isFreekassaApiConfigured } from "@/lib/payments/freekassa";
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
  mode: "api";
  fkOrderId?: number;
};

/**
 * Только Freekassa API orders/create — как selfvpn (bot/services/freekassa.py).
 * SCI не используется: pay.fk.money ведёт на fmt.me без привязки i=44/36.
 */
export async function createFreekassaCheckout(
  input: FreekassaCheckoutInput,
): Promise<FreekassaCheckoutResult> {
  if (!isFreekassaApiConfigured()) {
    throw new Error("Freekassa API is not configured (FREEKASSA_API_KEY, MERCHANT_ID, SECRET_2)");
  }

  const paymentMethodId = input.paymentMethodId ?? DEFAULT_FREEKASSA_METHOD_ID;
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
