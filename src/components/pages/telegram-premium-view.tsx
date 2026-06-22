import { TrustStrip } from "@/components/trust/trust-strip";
import { TelegramPremiumForm } from "@/components/telegram/telegram-premium-form";
import { getTelegramPremiumQuote } from "@/lib/fazercards/catalog";
import { getPricingSettings } from "@/lib/settings";
import { calculateRetailRub, formatRub } from "@/lib/pricing";

export async function TelegramPremiumView({ heading = "Telegram Premium" }: { heading?: string }) {
  const [quote, settings] = await Promise.all([
    getTelegramPremiumQuote().catch(() => null),
    getPricingSettings(),
  ]);

  const plans = (quote?.plans ?? []).map((p) => ({
    months: p.months,
    priceRub: calculateRetailRub(parseFloat(p.price_usd), settings),
  }));

  return (
    <div className="space-y-6">
      <TrustStrip />
      <TelegramPremiumForm
        heading={heading}
        plans={plans.map((p) => ({
          months: p.months,
          label: `${p.months} мес.`,
          price: formatRub(p.priceRub),
          priceRub: p.priceRub,
        }))}
      />
    </div>
  );
}
