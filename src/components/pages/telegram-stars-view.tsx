import { TrustStrip } from "@/components/trust/trust-strip";
import { TelegramStarsForm } from "@/components/telegram/telegram-stars-form";
import { getTelegramStarsQuote } from "@/lib/fazercards/catalog";
import { getPricingSettings } from "@/lib/settings";
import { calculateRetailRub, formatRub } from "@/lib/pricing";

export async function TelegramStarsView({ heading = "Telegram Stars" }: { heading?: string }) {
  const [quote, settings] = await Promise.all([
    getTelegramStarsQuote().catch(() => null),
    getPricingSettings(),
  ]);

  const pricePerStarUsd = quote ? parseFloat(quote.price_per_star) : 0;
  const pricePerStarRub = pricePerStarUsd
    ? calculateRetailRub(pricePerStarUsd, settings)
    : null;

  return (
    <div className="space-y-6">
      <TrustStrip />
      <TelegramStarsForm
        heading={heading}
        minAmount={quote?.min_amount ?? 50}
        maxAmount={quote?.max_amount ?? 10000}
        pricePerStarRub={pricePerStarRub}
        priceLabel={pricePerStarRub ? `${formatRub(pricePerStarRub)} / звезда` : undefined}
      />
    </div>
  );
}
