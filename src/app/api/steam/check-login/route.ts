import { NextResponse } from "next/server";
import { checkSteamLogin } from "@/lib/fazercards/catalog";
import { isFazerConfigured } from "@/lib/fazercards/client";

export async function POST(request: Request) {
  if (!isFazerConfigured()) {
    return NextResponse.json({ ok: false, can_refill: false }, { status: 503 });
  }

  const body = await request.json();
  const steamLogin = String(body.steamLogin ?? "").trim();
  if (!steamLogin) {
    return NextResponse.json({ ok: false, error: "steamLogin required" }, { status: 400 });
  }

  try {
    const result = await checkSteamLogin(steamLogin);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ ok: false, can_refill: false }, { status: 502 });
  }
}
