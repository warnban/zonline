import { FazerCardsClient } from "fazercards";
import { env } from "@/lib/env";

let client: FazerCardsClient | null = null;

export function getFazerClient(): FazerCardsClient {
  if (!env.FAZER_API_KEY) {
    throw new Error("FAZER_API_KEY is not configured");
  }
  if (!client) {
    client = new FazerCardsClient({
      apiKey: env.FAZER_API_KEY,
      baseUrl: env.FAZER_API_BASE_URL,
      appName: "zynqo/1.0",
    });
  }
  return client;
}

export function isFazerConfigured(): boolean {
  return Boolean(env.FAZER_API_KEY);
}

export async function fazerRequest<T>(
  method: string,
  path: string,
  init?: {
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    idempotencyKey?: string;
  },
): Promise<T> {
  const fz = getFazerClient();
  return fz.request<T>(method, path, init);
}
