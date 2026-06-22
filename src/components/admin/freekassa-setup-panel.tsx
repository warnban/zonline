import { getFreekassaUrls } from "@/lib/payments/freekassa";
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

  return (
    <section className="mt-10 max-w-2xl">
      <h2 className="text-lg font-semibold">Freekassa — URL для заявки</h2>
      <p className="mt-1 text-sm text-muted">
        Только для администратора. Скопируйте в личный кабинет Freekassa. Домен:{" "}
        <span className="font-medium text-foreground">{env.APP_URL.replace(/^https?:\/\//, "")}</span>
      </p>

      <div className="mt-4 space-y-3">
        <CopyBlock
          label="URL оповещения (Result URL)"
          hint={`Метод: ${urls.notifyMethod}. Ответ сервера: YES.`}
          value={urls.notify}
        />
        <CopyBlock
          label="URL успешной оплаты (Success URL)"
          hint={`Метод: ${urls.successMethod}.`}
          value={urls.success}
        />
        <CopyBlock
          label="URL неудачи (Fail URL)"
          hint={`Метод: ${urls.failMethod}.`}
          value={urls.fail}
        />
      </div>

      <p className="mt-4 text-xs text-muted">
        Переменные: FREEKASSA_MERCHANT_ID, FREEKASSA_SECRET_1, FREEKASSA_SECRET_2 в .env на сервере.
        SECRET 2 — для подписи URL оповещения.
      </p>
    </section>
  );
}
