import type { Metadata } from "next";
import Link from "next/link";
import { ServiceTile } from "@/components/catalog/service-tile";
import { TrustStrip } from "@/components/trust/trust-strip";

export const metadata: Metadata = {
  title: "Telegram",
  description: "Telegram Stars и Premium — быстро и безопасно.",
};

export default function TelegramHubPage() {
  return (
    <div className="space-y-8">
      <TrustStrip />
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Telegram</h1>
        <p className="mt-2 text-muted">Stars & Premium — быстро, безопасно и удобно</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ServiceTile
          href="/telegram/stars"
          id="telegram-stars"
          title="Telegram Stars"
          desc="Пополнение звёзд по @username"
        />
        <ServiceTile
          href="/telegram/premium"
          id="telegram-premium"
          title="Telegram Premium"
          desc="Подписка на 3, 6 или 12 месяцев"
        />
      </div>
      <p className="text-sm text-muted">
        <Link href="/products" className="text-accent hover:underline">
          ← Все продукты
        </Link>
      </p>
    </div>
  );
}
