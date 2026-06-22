import type { PricingSettings } from "@/lib/settings";

export function calculateRetailRub(
  wholesaleUsd: number,
  settings: PricingSettings,
  extraMarkupPct = 0,
): number {
  const markup = settings.defaultMarkupPct + extraMarkupPct;
  return Math.ceil(wholesaleUsd * settings.usdRubRate * (1 + markup / 100));
}

/** Сумма к оплате за пополнение Steam: walletAmountRub — сколько зачислится на кошелёк */
export function calculateSteamPaymentRub(
  walletAmountRub: number,
  settings: PricingSettings,
): { walletRub: number; feeRub: number; totalRub: number; feePct: number } {
  const feePct = settings.defaultMarkupPct + settings.steamCommissionPct;
  const totalRub = Math.ceil(walletAmountRub * (1 + feePct / 100));
  const feeRub = totalRub - walletAmountRub;
  return { walletRub: walletAmountRub, feeRub, totalRub, feePct };
}

/** Оценка USD себестоимости Steam-пополнения по курсу FazerCards */
export function steamWalletRubToWholesaleUsd(
  walletAmountRub: number,
  rubPerUsd: number,
): number {
  if (rubPerUsd <= 0) return 0;
  return walletAmountRub / rubPerUsd;
}

export function formatRub(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUsd(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

export function slugify(text: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return text
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generatePublicOrderId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ZYN-${code}`;
}
