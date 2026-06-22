import { NextResponse } from "next/server";
import { z } from "zod";
import {
  checkSteamLogin,
  getGiftCardOffers,
  getTelegramPremiumQuote,
  getTelegramStarsQuote,
  getTopupOffers,
  getGameKeyOffers,
  getSteamRates,
} from "@/lib/fazercards/catalog";
import { isFazerConfigured } from "@/lib/fazercards/client";
import { buildOrderFromBody } from "@/lib/orders/build-order";
import { createOrderWithPayment } from "@/lib/orders/create";
import { createOrderSchema } from "@/lib/orders/schemas";
import { getPricingSettings } from "@/lib/settings";
import {
  calculateRetailRub,
  calculateSteamPaymentRub,
  steamWalletRubToWholesaleUsd,
} from "@/lib/pricing";

async function resolvePricing(body: z.infer<typeof createOrderSchema>) {
  const settings = await getPricingSettings();

  switch (body.type) {
    case "STEAM": {
      const loginCheck = await checkSteamLogin(body.steamLogin.trim());
      if (!loginCheck.can_refill) {
        throw new Error("STEAM_LOGIN_INVALID");
      }
      const { totalRub } = calculateSteamPaymentRub(body.walletAmountRub, settings);
      const rates = await getSteamRates();
      const rubPerUsd = rates?.rates?.RUB ?? settings.usdRubRate;
      return {
        totalAmountRub: totalRub,
        amountUsd: steamWalletRubToWholesaleUsd(body.walletAmountRub, rubPerUsd),
      };
    }
    case "TELEGRAM_STARS": {
      const quote = await getTelegramStarsQuote();
      const pricePerStar = parseFloat(quote.price_per_star);
      const amountUsd = pricePerStar * body.quantity;
      return {
        totalAmountRub: calculateRetailRub(amountUsd, settings),
        amountUsd,
      };
    }
    case "TELEGRAM_PREMIUM": {
      const quote = await getTelegramPremiumQuote();
      const plan = quote.plans.find((p) => p.months === body.months);
      if (!plan) throw new Error("PLAN_NOT_FOUND");
      const amountUsd = parseFloat(plan.price_usd);
      return {
        totalAmountRub: calculateRetailRub(amountUsd, settings),
        amountUsd,
      };
    }
    case "GIFT_CARD": {
      const offers = await getGiftCardOffers(body.categoryId);
      const offer = offers.items?.find((o) => String(o.card_id) === body.cardId);
      if (!offer) throw new Error("OFFER_NOT_FOUND");
      const amountUsd = parseFloat(String(offer.price_usd ?? "0"));
      if (!amountUsd) throw new Error("OFFER_PRICE_INVALID");
      return {
        totalAmountRub: calculateRetailRub(amountUsd, settings),
        amountUsd,
      };
    }
    case "TOPUP": {
      const offers = await getTopupOffers(body.categoryId);
      const offer = offers.items?.find((o) => String(o.offer_id) === body.offerId);
      if (!offer) throw new Error("OFFER_NOT_FOUND");
      const amountUsd = parseFloat(String(offer.price_usd ?? "0"));
      if (!amountUsd) throw new Error("OFFER_PRICE_INVALID");
      return {
        totalAmountRub: calculateRetailRub(amountUsd, settings),
        amountUsd,
      };
    }
    case "GAME_KEY": {
      const offers = await getGameKeyOffers(body.categoryId);
      const offer = offers.items?.find((o) => String(o.card_id) === body.cardId);
      if (!offer) throw new Error("OFFER_NOT_FOUND");
      const amountUsd = parseFloat(String(offer.price_usd ?? "0"));
      if (!amountUsd) throw new Error("OFFER_PRICE_INVALID");
      return {
        totalAmountRub: calculateRetailRub(amountUsd, settings),
        amountUsd,
      };
    }
  }
}

export async function POST(request: Request) {
  if (!isFazerConfigured()) {
    return NextResponse.json({ error: "Сервис временно недоступен" }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;

  try {
    const pricing = await resolvePricing(body);
    const built = buildOrderFromBody(body);

    const result = await createOrderWithPayment({
      orderType: built.orderType,
      email: body.email,
      totalAmountRub: pricing.totalAmountRub,
      amountUsd: pricing.amountUsd,
      metadata: built.metadata,
    });

    if (!result.paymentUrl) {
      return NextResponse.json(
        { ...result, error: "Оплата временно недоступна. Попробуйте позже или напишите в поддержку." },
        { status: 503 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Order failed";
    if (msg === "STEAM_LOGIN_INVALID") {
      return NextResponse.json({ error: "Steam login cannot be refilled" }, { status: 400 });
    }
    if (msg === "OFFER_NOT_FOUND") {
      return NextResponse.json({ error: "Product not available" }, { status: 404 });
    }
    console.error("[orders]", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 502 });
  }
}
