import { TrustStrip } from "@/components/trust/trust-strip";
import { SteamCheckoutForm } from "@/components/steam/steam-checkout-form";
import { getSteamRates } from "@/lib/fazercards/catalog";
import { getPricingSettings } from "@/lib/settings";

export async function SteamLandingView({ heading = "Пополнение Steam" }: { heading?: string }) {
  const [rates, settings] = await Promise.all([
    getSteamRates(),
    getPricingSettings(),
  ]);

  return (
    <div className="space-y-6">
      <TrustStrip />
      <SteamCheckoutForm rates={rates} settings={settings} heading={heading} />
    </div>
  );
}
