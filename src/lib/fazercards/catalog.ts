import { cacheGet, cacheSet } from "@/lib/redis";
import { fazerRequest, isFazerConfigured } from "./client";

const CACHE_TTL = 600;

export async function getFazerBalance() {
  if (!isFazerConfigured()) return null;
  const cached = await cacheGet<{ balance: string }>("fazer:balance");
  if (cached) return cached;

  const data = await fazerRequest<{ ok: boolean; balance?: string; amount?: string }>(
    "GET",
    "/balance",
  );
  const result = { balance: data.balance ?? data.amount ?? "0" };
  await cacheSet("fazer:balance", result, 60);
  return result;
}

export async function getSteamRates() {
  if (!isFazerConfigured()) return null;
  const cached = await cacheGet<SteamRates>("fazer:steam:rates");
  if (cached) return cached;

  const data = await fazerRequest<{
    ok: boolean;
    rates: Record<string, number>;
    updated_at: string;
  }>("GET", "/steam-topup/rates");

  const result: SteamRates = {
    rates: data.rates,
    updatedAt: data.updated_at,
  };
  await cacheSet("fazer:steam:rates", result, CACHE_TTL);
  return result;
}

export async function checkSteamLogin(steamLogin: string) {
  return fazerRequest<{ ok: boolean; can_refill: boolean }>(
    "POST",
    "/steam-topup/check-login",
    { body: { steamLogin } },
  );
}

export async function getTelegramStarsQuote() {
  const cached = await cacheGet<TelegramStarsQuote>("fazer:telegram:stars");
  if (cached) return cached;

  const data = await fazerRequest<TelegramStarsQuote>("GET", "/telegram/stars");
  await cacheSet("fazer:telegram:stars", data, CACHE_TTL);
  return data;
}

export async function getTelegramPremiumQuote() {
  const cached = await cacheGet<TelegramPremiumQuote>("fazer:telegram:premium");
  if (cached) return cached;

  const data = await fazerRequest<TelegramPremiumQuote>("GET", "/telegram/premium");
  await cacheSet("fazer:telegram:premium", data, CACHE_TTL);
  return data;
}

export type FieldDef = { key: string; label?: string; required?: boolean; type?: string };

type RawOffer = {
  card_id?: string;
  offer_id?: string;
  name?: string;
  price_usd?: string;
  fields?: FieldDef[];
  [key: string]: unknown;
};

type RawOffersPayload = {
  ok?: boolean;
  items?: RawOffer[];
  offers?: RawOffer[];
  fields?: FieldDef[];
};

function normalizeCardOffers(data: RawOffersPayload): GiftCardOffersList {
  const items = (data.offers ?? data.items ?? []).map((o) => ({
    ...o,
    card_id: String(o.card_id ?? o.offer_id ?? ""),
  })) as GiftCardOffer[];
  return { ok: Boolean(data.ok ?? items.length > 0), items };
}

function normalizeTopupOffers(data: RawOffersPayload): TopupOffersList {
  const fields = data.fields ?? [];
  const items = (data.offers ?? data.items ?? []).map((o) => ({
    ...o,
    offer_id: String(o.offer_id ?? o.card_id ?? ""),
    fields: o.fields ?? fields,
  })) as TopupOffer[];
  return { ok: Boolean(data.ok ?? items.length > 0), items, fields };
}

function cacheableOffers<T extends { ok: boolean; items: unknown[] }>(result: T): boolean {
  return result.ok && result.items.length > 0;
}

export async function getGiftCardOffers(categoryId: string) {
  const key = `fazer:giftcards:cards:v3:${categoryId}`;
  const cached = await cacheGet<GiftCardOffersList>("cache:" + key);
  if (cached && cacheableOffers(cached)) return cached;

  const data = await fazerRequest<RawOffersPayload>("GET", "/giftcards/cards", {
    query: { category_id: categoryId },
  });
  const result = normalizeCardOffers(data);
  if (cacheableOffers(result)) {
    await cacheSet("cache:" + key, result, CACHE_TTL);
  }
  return result;
}

export async function getTopupOffers(categoryId: string) {
  const key = `fazer:topups:offers:v3:${categoryId}`;
  const cached = await cacheGet<TopupOffersList>("cache:" + key);
  if (cached && cacheableOffers(cached)) return cached;

  const data = await fazerRequest<RawOffersPayload>("GET", "/topups/offers", {
    query: { category_id: categoryId },
  });
  const result = normalizeTopupOffers(data);
  if (cacheableOffers(result)) {
    await cacheSet("cache:" + key, result, CACHE_TTL);
  }
  return result;
}

export async function getGameKeyOffers(categoryId: string) {
  const key = `fazer:gamekeys:keys:v3:${categoryId}`;
  const cached = await cacheGet<GameKeyOffersList>("cache:" + key);
  if (cached && cacheableOffers(cached)) return cached;

  const data = await fazerRequest<RawOffersPayload>("GET", "/gamekeys/keys", {
    query: { category_id: categoryId },
  });
  const result = normalizeCardOffers(data);
  if (cacheableOffers(result)) {
    await cacheSet("cache:" + key, result, CACHE_TTL);
  }
  return result;
}

export type GiftCardOffer = {
  card_id: string;
  name?: string;
  price_usd?: string;
  currency?: string;
  [key: string]: unknown;
};

export type GiftCardOffersList = {
  ok: boolean;
  items: GiftCardOffer[];
};

export type TopupOffer = {
  offer_id: string;
  name?: string;
  price_usd?: string;
  fields?: { key: string; label?: string; required?: boolean }[];
  [key: string]: unknown;
};

export type TopupOffersList = {
  ok: boolean;
  items: TopupOffer[];
  fields?: FieldDef[];
};

export type GameKeyOffer = GiftCardOffer;
export type GameKeyOffersList = GiftCardOffersList;

export async function getGiftCardCategories(cursor?: string) {
  const key = `fazer:giftcards:${cursor ?? "root"}`;
  const cached = await cacheGet<GiftCardList>("cache:" + key);
  if (cached) return cached;

  const data = await fazerRequest<GiftCardList>("GET", "/giftcards", {
    query: { include_ui: 1, limit: 50, ...(cursor ? { cursor } : {}) },
  });
  await cacheSet("cache:" + key, data, CACHE_TTL);
  return data;
}

export async function getTopupCategories(cursor?: string) {
  const key = `fazer:topups:${cursor ?? "root"}`;
  const cached = await cacheGet<TopupList>("cache:" + key);
  if (cached) return cached;

  const data = await fazerRequest<TopupList>("GET", "/topups", {
    query: { include_ui: 1, limit: 50, ...(cursor ? { cursor } : {}) },
  });
  await cacheSet("cache:" + key, data, CACHE_TTL);
  return data;
}

export async function getGameKeyCategories(cursor?: string) {
  const key = `fazer:gamekeys:${cursor ?? "root"}`;
  const cached = await cacheGet<GameKeyList>("cache:" + key);
  if (cached) return cached;

  const data = await fazerRequest<GameKeyList>("GET", "/gamekeys", {
    query: { include_ui: 1, limit: 50, ...(cursor ? { cursor } : {}) },
  });
  await cacheSet("cache:" + key, data, CACHE_TTL);
  return data;
}

export type SteamRates = {
  rates: Record<string, number>;
  updatedAt: string;
};

export type TelegramStarsQuote = {
  ok: boolean;
  price_per_star: string;
  min_amount: number;
  max_amount: number;
};

export type TelegramPremiumQuote = {
  ok: boolean;
  plans: { months: number; price_usd: string }[];
};

export type CatalogItem = {
  category_id: string;
  name: string;
  note?: string;
  imageurl?: string | null;
};

export type CatalogListMeta = {
  total: number;
  limit: number;
  next_cursor: string | null;
  has_more: boolean;
};

export type GiftCardList = {
  ok: boolean;
  items: CatalogItem[];
  meta: CatalogListMeta;
};

export type TopupList = GiftCardList;
export type GameKeyList = GiftCardList;
