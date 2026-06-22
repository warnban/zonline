import { getFreekassaUrls, getFreekassaConfigStatus } from "@/lib/payments/freekassa";
import { FREEKASSA_PAYMENT_METHODS } from "@/lib/payments/freekassa-methods";
import { env } from "@/lib/env";

function CopyBlock({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <code className="mt-2 block break-all rounded-md bg-surface-elevated px-3 py-2 text-sm">
        {value}
      </code>
    </div>
  );
}

export function FreekassaSetupPanel() {
  const urls = getFreekassaUrls();
  const fk = getFreekassaConfigStatus();

  return (
    <section className="mt-10 max-w-2xl">
      <h2 className="text-lg font-semibold">Freekassa — оплата и URL</h2>
      <p className="mt-1 text-sm text-muted">
        Домен:{" "}
        <span className="font-medium text-foreground">{env.APP_URL.replace(/^https?:\/\//, "")}</span>
        {" · "}
        Режим оплаты:{" "}
        <span className="font-medium text-foreground">
          {fk.paymentMode === "api"
            ? "API orders/create (как selfvpn)"
            : "не настроено"}
        </span>
      </p>

      <div className="mt-4 rounded-xl border border-border bg-surface-elevated/50 p-4 text-sm">
        <p className="font-medium">Переменные .env</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted">
          <li>
            <code>FREEKASSA_API_KEY</code> — обязателен для СБП (44) и карт (36)
          </li>
          <li>
            <code>FREEKASSA_MERCHANT_ID</code> — ID магазина
          </li>
          <li>
            <code>FREEKASSA_SECRET_2</code> — подпись вебхука (ответ YES)
          </li>
          <li>
            <code>FREEKASSA_CLIENT_IP</code> — IP сервера для API (как FREEKASSA_CLIENT_IP_FALLBACK в selfvpn)
          </li>
        </ul>
        {fk.missing.length > 0 && (
          <p className="mt-2 text-xs text-warning">Не задано: {fk.missing.join(", ")}</p>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <CopyBlock
          label="URL оповещения (notification_url)"
          hint={`Метод: ${urls.notifyMethod}. Ответ сервера: YES.`}
          value={urls.notify}
        />
        <CopyBlock
          label="URL успешной оплаты (success_url)"
          hint={`Метод: ${urls.successMethod}.`}
          value={urls.success}
        />
        <CopyBlock
          label="URL неудачи (failure_url)"
          hint={`Метод: ${urls.failMethod}.`}
          value={urls.fail}
        />
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold">Способы оплаты (параметр i)</h3>
        <p className="mt-1 text-xs text-muted">Используются на сайте и в Telegram-боте.</p>
        <ul className="mt-3 space-y-2">
          {FREEKASSA_PAYMENT_METHODS.map((m) => (
            <li key={m.id} className="rounded-lg border border-border px-3 py-2 text-sm">
              <span className="font-medium">
                i={m.id} — {m.label}
              </span>
              {m.feeNote && <span className="mt-0.5 block text-xs text-muted">{m.feeNote}</span>}
              {m.minUsdt != null && (
                <span className="mt-0.5 block text-xs text-muted">Минимум {m.minUsdt} USDT</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
