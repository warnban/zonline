import { createFreekassaApiOrder } from "@/lib/payments/freekassa-api";
import {
  buildFreekassaPaymentUrl,
  isFreekassaApiConfigured,
  isFreekassaSciConfigured,
} from "@/lib/payments/freekassa";
import {
  DEFAULT_FREEKASSA_METHOD_ID,
  isApiOnlyFreekassaMethod,
} from "@/lib/payments/freekassa-methods";

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
 * СБП (44) и карты РФ API (36) — только orders/create (на fmt.me иначе «только по API»).
 * Крипта — API если есть ключ, иначе SCI.
 */
export async function createFreekassaCheckout(
  input: FreekassaCheckoutInput,
): Promise<FreekassaCheckoutResult> {
  const paymentMethodId = input.paymentMethodId ?? DEFAULT_FREEKASSA_METHOD_ID;
  const mustUseApi = isApiOnlyFreekassaMethod(paymentMethodId);

  if (mustUseApi || isFreekassaApiConfigured()) {
    if (!isFreekassaApiConfigured()) {
      throw new Error("Freekassa API required for SBP and card payments (FREEKASSA_API_KEY)");
    }
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

  throw new Error("Freekassa is not configured");
}
