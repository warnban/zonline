import { NextResponse } from "next/server";
import { validateTelegramUsername } from "@/lib/fazercards/validate";
import { isFazerConfigured } from "@/lib/fazercards/client";

export async function POST(request: Request) {
  const body = await request.json();
  const username = String(body.username ?? body.telegramUsername ?? "").trim();

  if (!username) {
    return NextResponse.json({ ok: false, error: "username required" }, { status: 400 });
  }

  if (!isFazerConfigured()) {
    const normalized = username.replace(/^@/, "");
    const valid = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(normalized);
    return NextResponse.json({
      ok: true,
      valid,
      skipped: true,
      message: valid ? "Формат username корректен" : "Некорректный формат username",
    });
  }

  const result = await validateTelegramUsername(username);
  return NextResponse.json({ ok: true, ...result });
}
