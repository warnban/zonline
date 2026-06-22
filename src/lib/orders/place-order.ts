import { isFazerConfigured } from "@/lib/fazercards/client";
import {
  checkSteamLogin,
  getGiftCardOffers,
  getTelegramPremiumQuote,
  getTelegramStarsQuote,
  getTopupOffers,
  getGameKeyOffers,
  getSteamRates,
} from "@/lib/fazercards/catalog";
import { buildOrderFromBody } from "@/lib/orders/build-order";
import { createOrderWithPayment } from "@/lib/orders/create";
import type { CreateOrderBody } from "@/lib/orders/schemas";
import { getPricingSettings } from "@/lib/settings";
import {
  calculateRetailRub,
  calculateSteamPaymentRub,
  steamWalletRubToWholesaleUsd,
} from "@/lib/pricing";
import {
  DEFAULT_FREEKASSA_METHOD_ID,
  isValidFreekassaMethodId,
} from "@/lib/payments/freekassa-methods";

export type PlaceOrderOptions = {
  clientIp: string;
  paymentMethodId?: number;
  extraMetadata?: Record<string, unknown>;
};

async function resolvePricing(body: CreateOrderBody) {
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

export async function placeOrder(body: CreateOrderBody, options: PlaceOrderOptions) {
  if (!isFazerConfigured()) {
    throw new Error("FAZER_NOT_CONFIGURED");
  }

  const paymentMethodId =
    options.paymentMethodId != null && isValidFreekassaMethodId(options.paymentMethodId)
      ? options.paymentMethodId
      : DEFAULT_FREEKASSA_METHOD_ID;

  const pricing = await resolvePricing(body);
  const built = buildOrderFromBody(body);

  const metadata = {
    ...built.metadata,
    ...options.extraMetadata,
    paymentMethodId,
  };

  return createOrderWithPayment({
    orderType: built.orderType,
    email: body.email,
    totalAmountRub: pricing.totalAmountRub,
    amountUsd: pricing.amountUsd,
    metadata,
    paymentMethodId,
    clientIp: options.clientIp,
  });
}
