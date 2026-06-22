import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  FAZER_API_KEY: z.string().optional(),
  FAZER_WEBHOOK_SECRET: z.string().optional(),
  FAZER_API_BASE_URL: z
    .string()
    .default("https://api.fzr.cards/api/v2"),
  FREEKASSA_MERCHANT_ID: z.string().optional(),
  FREEKASSA_SECRET_1: z.string().optional(),
  FREEKASSA_SECRET_2: z.string().optional(),
  APP_URL: z.string().default("http://localhost:3000"),
  /** Курс USD→RUB (пересчёт оптовой цены, не наценка) */
  USD_RUB_RATE: z.coerce.number().default(92),
  /** Общая наценка сервиса, % */
  DEFAULT_MARKUP_PCT: z.coerce.number().default(10),
  /** Доп. комиссия за пополнение Steam, % (от суммы на кошелёк) */
  STEAM_COMMISSION_PCT: z.coerce.number().default(1),
  /** Фикс. сервисный сбор за пополнение Steam, ₽ */
  STEAM_FIXED_FEE_RUB: z.coerce.number().default(50),
  ADMIN_JWT_SECRET: z.string().default("dev-admin-secret-change-me"),
  ADMIN_BOOTSTRAP_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  YANDEX_VERIFICATION: z.string().optional(),
  GOOGLE_SITE_VERIFICATION: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.warn("Env validation warnings:", parsed.error.flatten().fieldErrors);
    return envSchema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://zynqo:zynqo@localhost:5433/zynqo",
    });
  }
  return parsed.data;
}

export const env = loadEnv();
