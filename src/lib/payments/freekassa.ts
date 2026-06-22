import { createHash, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/** SCI — форма оплаты https://docs.freekassa.net/ */
export const FREEKASSA_PAY_URL = "https://pay.fk.money/";

export const FREEKASSA_NOTIFY_IPS = [
  "168.119.157.136",
  "168.119.60.227",
  "178.154.197.79",
  "51.250.54.238",
] as const;

export const FREEKASSA_PATHS = {
  notify: "/api/payments/freekassa/notify",
  success: "/payment/success",
  fail: "/payment/fail",
} as const;

export type FreekassaUrls = {
  notify: string;
  success: string;
  fail: string;
  notifyMethod: "GET" | "POST";
  successMethod: "GET";
  failMethod: "GET";
};

export function isFreekassaNotifyConfigured(): boolean {
  return Boolean(env.FREEKASSA_MERCHANT_ID?.trim() && env.FREEKASSA_SECRET_2?.trim());
}

/** Только API orders/create (как selfvpn). */
export function isFreekassaApiConfigured(): boolean {
  return Boolean(
    env.FREEKASSA_API_KEY?.trim() &&
      env.FREEKASSA_MERCHANT_ID?.trim() &&
      isFreekassaNotifyConfigured(),
  );
}

export function isFreekassaConfigured(): boolean {
  return isFreekassaApiConfigured();
}

/** SCI — legacy, не используется для checkout (selfvpn тоже только API). */
export function isFreekassaSciConfigured(): boolean {
  return Boolean(
    env.FREEKASSA_MERCHANT_ID?.trim() &&
      env.FREEKASSA_SECRET_1?.trim() &&
      isFreekassaNotifyConfigured(),
  );
}

/** Для диагностики — какие переменные не заданы (без значений). */
export function getFreekassaConfigStatus(): {
  configured: boolean;
  paymentMode: "api" | "none";
  missing: string[];
} {
  const missing: string[] = [];
  if (!env.FREEKASSA_MERCHANT_ID?.trim()) missing.push("FREEKASSA_MERCHANT_ID");
  if (!env.FREEKASSA_SECRET_2?.trim()) missing.push("FREEKASSA_SECRET_2");
  if (!env.FREEKASSA_API_KEY?.trim()) missing.push("FREEKASSA_API_KEY");
  if (!env.FREEKASSA_CLIENT_IP?.trim()) {
    missing.push("FREEKASSA_CLIENT_IP (fallback IP для API)");
  }

  return {
    configured: isFreekassaApiConfigured(),
    paymentMode: isFreekassaApiConfigured() ? "api" : "none",
    missing,
  };
}

export function getFreekassaUrls(baseUrl = env.APP_URL): FreekassaUrls {
  const base = baseUrl.replace(/\/$/, "");
  return {
    notify: `${base}${FREEKASSA_PATHS.notify}`,
    success: `${base}${FREEKASSA_PATHS.success}`,
    fail: `${base}${FREEKASSA_PATHS.fail}`,
    notifyMethod: "GET",
    successMethod: "GET",
    failMethod: "GET",
  };
}

export type FreekassaPaymentParams = {
  orderId: string;
  amountRub: number;
  email?: string;
  currency?: "RUB" | "USD" | "EUR" | "UAH" | "KZT";
  /** ID способа оплаты (i), необязательно */
  paymentMethodId?: number;
};

/** MD5(m:oa:secret1:currency:o) — подпись платёжной формы */
export function buildFreekassaPaymentSign(
  merchantId: string,
  amount: string,
  secret1: string,
  currency: string,
  orderId: string,
): string {
  return md5(`${merchantId}:${amount}:${secret1}:${currency}:${orderId}`);
}

/** Полный URL редиректа на оплату (GET https://pay.fk.money/) */
export function buildFreekassaPaymentUrl(params: FreekassaPaymentParams): string {
  if (!isFreekassaSciConfigured()) {
    throw new Error("Freekassa SCI is not configured (need FREEKASSA_SECRET_1)");
  }

  const merchantId = env.FREEKASSA_MERCHANT_ID!;
  const secret1 = env.FREEKASSA_SECRET_1!;
  const currency = params.currency ?? "RUB";
  const amount = formatAmount(params.amountRub);

  const sign = buildFreekassaPaymentSign(
    merchantId,
    amount,
    secret1,
    currency,
    params.orderId,
  );

  const query = new URLSearchParams({
    m: merchantId,
    oa: amount,
    o: params.orderId,
    s: sign,
    currency,
    lang: "ru",
  });

  if (params.email) query.set("em", params.email);
  if (params.paymentMethodId != null) {
    query.set("i", String(params.paymentMethodId));
  }

  return `${FREEKASSA_PAY_URL}?${query.toString()}`;
}

export type FreekassaNotification = {
  merchantId: string;
  amount: string;
  intId: string;
  merchantOrderId: string;
  email?: string;
  phone?: string;
  curId?: string;
  sign: string;
  raw: Record<string, string>;
};

export function parseFreekassaPayload(
  data: Record<string, string | undefined>,
): FreekassaNotification | null {
  const merchantId = data.MERCHANT_ID ?? data.m ?? "";
  const amount = data.AMOUNT ?? data.amount ?? "";
  const intId = data.intid ?? data.fk_order_id ?? "";
  const merchantOrderId = data.MERCHANT_ORDER_ID ?? data.o ?? "";
  const sign = data.SIGN ?? data.sign ?? "";

  if (!merchantId || !amount || !merchantOrderId || !sign) {
    return null;
  }

  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) raw[k] = v;
  }

  return {
    merchantId,
    amount,
    intId,
    merchantOrderId,
    email: data.P_EMAIL,
    phone: data.P_PHONE,
    curId: data.CUR_ID,
    sign,
    raw,
  };
}

/** MD5(MERCHANT_ID:AMOUNT:SECRET2:MERCHANT_ORDER_ID) */
export function verifyFreekassaNotificationSign(
  notification: FreekassaNotification,
  secret2: string,
): boolean {
  const expected = md5(
    `${notification.merchantId}:${notification.amount}:${secret2}:${notification.merchantOrderId}`,
  );
  return safeEqual(expected, notification.sign.toLowerCase());
}

export function isFreekassaNotifyIp(ip: string): boolean {
  const normalized = ip.replace(/^::ffff:/, "");
  return (FREEKASSA_NOTIFY_IPS as readonly string[]).includes(normalized);
}

export function amountsMatch(expectedRub: number, paidAmount: string): boolean {
  const paid = parseFloat(paidAmount.replace(",", "."));
  if (Number.isNaN(paid)) return false;
  return Math.abs(paid - expectedRub) < 0.02;
}

function formatAmount(rub: number): string {
  if (Number.isInteger(rub)) return String(rub);
  return rub.toFixed(2);
}

function md5(input: string): string {
  return createHash("md5").update(input).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return a === b;
  }
}
