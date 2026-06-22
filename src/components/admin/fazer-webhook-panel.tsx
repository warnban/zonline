import { env } from "@/lib/env";

export function FazerWebhookPanel() {
  const webhookUrl = `${env.APP_URL.replace(/\/$/, "")}/api/webhooks/fazercards`;

  return (
    <section className="mt-10 max-w-2xl">
      <h2 className="text-lg font-semibold">FazerCards — Webhook</h2>
      <p className="mt-1 text-sm text-muted">
        В панели реселлера:{" "}
        <a
          href="https://reseller.fazercards.com"
          className="text-accent hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          reseller.fazercards.com
        </a>{" "}
        → Настройки → Webhooks. Документация:{" "}
        <a
          href="https://reseller.fazercards.com/en/docs/webhooks"
          className="text-accent hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          docs/webhooks
        </a>
        .
      </p>

      <div className="card mt-4 p-4">
        <p className="text-sm font-medium">URL endpoint (HTTPS)</p>
        <code className="mt-2 block break-all rounded-md bg-surface-elevated px-3 py-2 text-sm">
          {webhookUrl}
        </code>
      </div>

      <p className="mt-4 text-xs text-muted">
        При создании webhook FazerCards выдаст <strong>секрет</strong> — скопируйте его в{" "}
        <code className="text-foreground">FAZER_WEBHOOK_SECRET</code> в .env на сервере. Без
        секрета endpoint отклоняет запросы (503). Webhook дополняет мгновенную выдачу после
        оплаты: если заказ долго в обработке, FazerCards пришлёт{" "}
        <code className="text-foreground">order.completed</code>.
      </p>
    </section>
  );
}
