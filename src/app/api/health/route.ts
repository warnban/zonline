import { NextResponse } from "next/server";
import { isFazerConfigured } from "@/lib/fazercards/client";
import { getFazerBalance } from "@/lib/fazercards/catalog";
import { cacheGet } from "@/lib/redis";

export async function GET() {
  let fazerBalance: string | null = null;
  let fazerOk = false;

  if (isFazerConfigured()) {
    try {
      const balance = await getFazerBalance();
      fazerBalance = balance?.balance ?? null;
      fazerOk = true;
    } catch {
      fazerOk = false;
    }
  }

  let redisOk = false;
  try {
    await cacheGet("health:ping");
    redisOk = true;
  } catch {
    redisOk = false;
  }

  return NextResponse.json({
    ok: true,
    services: {
      fazer: { configured: isFazerConfigured(), ok: fazerOk, balance: fazerBalance },
      redis: { ok: redisOk },
    },
    timestamp: new Date().toISOString(),
  });
}
