import { createHmac } from "node:crypto";
import { env } from "@/lib/env";
import { getFreekassaUrls } from "@/lib/payments/freekassa";
import { isValidFreekassaMethodId } from "@/lib/payments/freekassa-methods";

/** Как в selfvpn: bot/services/freekassa.py */
const FREEKASSA_API_URL = "https://api.fk.life/v1/orders/create";

export type CreateFreekassaApiOrderInput = {
  paymentId: string;
  amountRub: number;
  email: string;
  ip: string;
  paymentMethodId: number;
  currency?: string;
};

export type CreateFreekassaApiOrderResult = {
  paymentUrl: string;
  fkOrderId?: number;
  orderHash?: string;
};

/** Всегда 2 знака после запятой — как selfvpn format_amount(). */
function formatAmount(rub: number): string {
  return rub.toFixed(2);
}

function signApiRequest(data: Record<string, string | number>): string {
  const apiKey = env.FREEKASSA_API_KEY!;
  const sorted = Object.keys(data).sort();
  const line = sorted.map((k) => String(data[k])).join("|");
  return createHmac("sha256", apiKey).update(line).digest("hex");
}

/** Домены FK Wallet — не платёжная форма Freekassa (docs: pay.freekassa.net/form/...). */
const FREEKASSA_WALLET_HOSTS = new Set(["fmt.me", "fkwallet.io", "www.fkwallet.io"]);

function isFreekassaWalletUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      FREEKASSA_WALLET_HOSTS.has(host) ||
      host.endsWith(".fkwallet.io") ||
      host.endsWith(".fmt.me")
    );
  } catch {
    return false;
  }
}

function buildFreekassaPayFormUrl(orderId: number, orderHash: string): string {
  return `https://pay.freekassa.net/form/${orderId}/${orderHash}`;
}

function paymentLocationFromResponse(body: {
  location?: string;
  Location?: string;
  orderId?: number;
  orderHash?: string;
}): string {
  // Доки: location часто пустой; URL = pay.freekassa.net/form/{orderId}/{orderHash}
  if (body.orderId && body.orderHash) {
    return buildFreekassaPayFormUrl(body.orderId, body.orderHash);
  }

  const location = String(body.location ?? body.Location ?? "").trim();
  if (location && !isFreekassaWalletUrl(location)) return location;

  return "";
}

export function resolveFreekassaClientIp(requestIp?: string): string {
  const ip = requestIp?.trim();
  if (ip && ip !== "127.0.0.1" && ip !== "::1" && ip !== "0.0.0.0") return ip;
  if (env.FREEKASSA_CLIENT_IP) return env.FREEKASSA_CLIENT_IP;
  return "109.73.193.87";
}

export async function createFreekassaApiOrder(
  input: CreateFreekassaApiOrderInput,
): Promise<CreateFreekassaApiOrderResult> {
  const apiKey = env.FREEKASSA_API_KEY;
  const shopId = env.FREEKASSA_MERCHANT_ID;
  if (!apiKey || !shopId) {
    throw new Error("Freekassa API is not configured");
  }

  if (!isValidFreekassaMethodId(input.paymentMethodId)) {
    throw new Error(`Unsupported Freekassa payment method: ${input.paymentMethodId}`);
  }

  const urls = getFreekassaUrls();
  const data: Record<string, string | number> = {
    shopId: Number(shopId),
    nonce: Date.now(),
    paymentId: input.paymentId,
    i: input.paymentMethodId,
    email: input.email,
    ip: resolveFreekassaClientIp(input.ip),
    amount: formatAmount(input.amountRub),
    currency: input.currency ?? "RUB",
    success_url: urls.success,
    failure_url: urls.fail,
    notification_url: urls.notify,
  };

  const signature = signApiRequest(data);
  const requestBody = { ...data, signature };

  const res = await fetch(FREEKASSA_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(requestBody),
  });

  const text = await res.text();
  let body: {
    type?: string;
    location?: string;
    Location?: string;
    orderId?: number;
    orderHash?: string;
    message?: string;
    error?: string;
    data?: { message?: string };
  } = {};

  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    throw new Error(`Freekassa API invalid JSON: ${text.slice(0, 200)}`);
  }

  if (res.status >= 400 || body.type !== "success") {
    const msg = body.message ?? body.error ?? body.data?.message ?? `HTTP ${res.status}`;
    throw new Error(`Freekassa API error: ${msg}`);
  }

  const paymentUrl = paymentLocationFromResponse(body);
  if (!paymentUrl) {
    throw new Error(`Freekassa did not return payment URL: ${text.slice(0, 300)}`);
  }

  const apiLocation = String(body.location ?? body.Location ?? "").trim();
  if (apiLocation && isFreekassaWalletUrl(apiLocation)) {
    console.warn(
      "[freekassa] API returned FK Wallet redirect, using pay.freekassa.net form:",
      apiLocation,
    );
  }

  return {
    paymentUrl,
    fkOrderId: body.orderId,
    orderHash: body.orderHash,
  };
}
