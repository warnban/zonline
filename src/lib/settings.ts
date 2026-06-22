import { env } from "@/lib/env";
import { db } from "@/lib/db";

export type PricingSettings = {
  /** Курс USD→RUB для пересчёта оптовой цены (не наценка) */
  usdRubRate: number;
  /** Общая наценка сервиса, % */
  defaultMarkupPct: number;
  /** Комиссия Steam, % от суммы на кошелёк */
  steamCommissionPct: number;
  /** Фикс. сервисный сбор Steam, ₽ */
  steamFixedFeeRub: number;
};

const KEYS = {
  usdRubRate: "pricing.usd_rub_rate",
  defaultMarkupPct: "pricing.default_markup_pct",
  steamCommissionPct: "pricing.steam_commission_pct",
  steamFixedFeeRub: "pricing.steam_fixed_fee_rub",
} as const;

async function getDbNumber(key: string): Promise<number | null> {
  try {
    const row = await db.setting.findUnique({ where: { key } });
    if (!row) return null;
    const val = row.value;
    if (typeof val === "number") return val;
    if (typeof val === "object" && val !== null && "value" in val) {
      return Number((val as { value: number }).value);
    }
    return Number(val);
  } catch {
    return null;
  }
}

async function setDbNumber(key: string, value: number) {
  await db.setting.upsert({
    where: { key },
    create: { key, value: { value } },
    update: { value: { value } },
  });
}

export async function getPricingSettings(): Promise<PricingSettings> {
  const [usdRubRate, defaultMarkupPct, steamCommissionPct, steamFixedFeeRub] =
    await Promise.all([
      getDbNumber(KEYS.usdRubRate),
      getDbNumber(KEYS.defaultMarkupPct),
      getDbNumber(KEYS.steamCommissionPct),
      getDbNumber(KEYS.steamFixedFeeRub),
    ]);

  return {
    usdRubRate: usdRubRate ?? env.USD_RUB_RATE,
    defaultMarkupPct: defaultMarkupPct ?? env.DEFAULT_MARKUP_PCT,
    steamCommissionPct: steamCommissionPct ?? env.STEAM_COMMISSION_PCT,
    steamFixedFeeRub: steamFixedFeeRub ?? env.STEAM_FIXED_FEE_RUB,
  };
}

export async function updatePricingSettings(input: PricingSettings) {
  await Promise.all([
    setDbNumber(KEYS.usdRubRate, input.usdRubRate),
    setDbNumber(KEYS.defaultMarkupPct, input.defaultMarkupPct),
    setDbNumber(KEYS.steamCommissionPct, input.steamCommissionPct),
    setDbNumber(KEYS.steamFixedFeeRub, input.steamFixedFeeRub),
  ]);
}

export function getPricingSettingsSync(): PricingSettings {
  return {
    usdRubRate: env.USD_RUB_RATE,
    defaultMarkupPct: env.DEFAULT_MARKUP_PCT,
    steamCommissionPct: env.STEAM_COMMISSION_PCT,
    steamFixedFeeRub: env.STEAM_FIXED_FEE_RUB,
  };
}
