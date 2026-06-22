import { getPricingSettings } from "@/lib/settings";
import { PricingSettingsForm } from "@/components/admin/pricing-settings-form";
import { FreekassaSetupPanel } from "@/components/admin/freekassa-setup-panel";
import { FazerWebhookPanel } from "@/components/admin/fazer-webhook-panel";

export const metadata = { title: "Настройки · Admin", robots: { index: false } };

export default async function AdminSettingsPage() {
  const pricing = await getPricingSettings();

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Настройки</h1>
      <PricingSettingsForm
        usdRubRate={pricing.usdRubRate}
        defaultMarkupPct={pricing.defaultMarkupPct}
        steamCommissionPct={pricing.steamCommissionPct}
      />
      <FreekassaSetupPanel />
      <FazerWebhookPanel />
      <p className="mt-6 max-w-md text-xs text-muted">
        FazerCards API ключ задаётся в переменных окружения на сервере (FAZER_API_KEY).
      </p>
    </>
  );
}
