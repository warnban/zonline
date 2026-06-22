import { createHmac } from "node:crypto";
import { env } from "@/lib/env";
import { redis } from "@/lib/redis";
import { getFreekassaUrls } from "@/lib/payments/freekassa";

const FREEKASSA_API_URL = "https://api.fk.life/v1/orders/create";

const FREEKASSA_PAY_FORM_BASE = "https://pay.freekassa.net/form";

function buildFreekassaPayFormUrl(orderId: number, orderHash: string): string {
  return `${FREEKASSA_PAY_FORM_BASE}/${orderId}/${orderHash}`;
}

function resolvePaymentUrl(
  json: { location?: string; orderId?: number; orderHash?: string },
  headerLocation: string | null,
): string {
  // По докам: location — ссылка для клиента (может быть fmt.me, pay.freekassa.net и т.д.)
  const location = json.location?.trim() || headerLocation?.trim();
  if (location) return location;

  if (json.orderId && json.orderHash) {
    return buildFreekassaPayFormUrl(json.orderId, json.orderHash);
  }

  return "";
}

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

function formatAmount(rub: number): string {
  if (Number.isInteger(rub)) return String(rub);
  return rub.toFixed(2);
}

function signPayload(data: Record<string, string | number>, apiKey: string): string {
  const sorted = Object.keys(data).sort();
  const line = sorted.map((k) => String(data[k])).join("|");
  return createHmac("sha256", apiKey).update(line).digest("hex");
}

async function nextNonce(): Promise<number> {
  const ts = Date.now();
  if (redis) {
    try {
      const n = await redis.incr("freekassa:nonce");
      return Math.max(n, ts);
    } catch {
      // fallback
    }
  }
  return ts;
}

export function resolveFreekassaClientIp(requestIp?: string): string {
  const ip = requestIp?.trim();
  if (ip && ip !== "127.0.0.1" && ip !== "::1") return ip;
  if (env.FREEKASSA_CLIENT_IP) return env.FREEKASSA_CLIENT_IP;
  return "85.8.8.8";
}

export async function createFreekassaApiOrder(
  input: CreateFreekassaApiOrderInput,
): Promise<CreateFreekassaApiOrderResult> {
  const apiKey = env.FREEKASSA_API_KEY;
  const shopId = env.FREEKASSA_MERCHANT_ID;
  if (!apiKey || !shopId) {
    throw new Error("Freekassa API is not configured");
  }

  const urls = getFreekassaUrls();
  const nonce = await nextNonce();
  const amount = formatAmount(input.amountRub);
  const currency = input.currency ?? "RUB";
  const ip = resolveFreekassaClientIp(input.ip);

  const payload: Record<string, string | number> = {
    shopId: Number(shopId),
    nonce,
    paymentId: input.paymentId,
    i: input.paymentMethodId,
    email: input.email,
    ip,
    amount,
    currency,
    success_url: urls.success,
    failure_url: urls.fail,
    notification_url: urls.notify,
  };

  payload.signature = signPayload(payload, apiKey);

  const res = await fetch(FREEKASSA_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: {
    type?: string;
    location?: string;
    orderId?: number;
    orderHash?: string;
    message?: string;
    data?: { message?: string };
  } = {};

  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(`Freekassa API invalid response: ${text.slice(0, 200)}`);
  }

  if (!res.ok || json.type !== "success") {
    const msg = json.message ?? json.data?.message ?? text.slice(0, 300);
    throw new Error(`Freekassa API error: ${msg}`);
  }

  const headerLocation = res.headers.get("location");
  const paymentUrl = resolvePaymentUrl(json, headerLocation);

  if (!paymentUrl) {
    throw new Error("Freekassa API: missing payment URL");
  }

  return {
    paymentUrl,
    fkOrderId: json.orderId,
    orderHash: json.orderHash,
  };
}
