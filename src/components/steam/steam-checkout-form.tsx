"use client";

import { useMemo, useState } from "react";
import { calculateSteamPaymentRub, formatRub } from "@/lib/pricing";
import { ValidationHint, type ValidationStatus } from "@/components/checkout/validation-hint";
import type { SteamRates } from "@/lib/fazercards/catalog";
import type { PricingSettings } from "@/lib/settings";

type Props = {
  rates: SteamRates | null;
  settings: PricingSettings;
  heading?: string;
};

export function SteamCheckoutForm({ rates, settings, heading = "Пополнение Steam" }: Props) {
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("500");
  const [checking, setChecking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("idle");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const walletRub = parseInt(amount, 10) || 0;

  const payment = useMemo(() => {
    if (walletRub <= 0) return null;
    return calculateSteamPaymentRub(walletRub, settings);
  }, [walletRub, settings]);

  async function checkLogin() {
    if (!login.trim()) return;
    setChecking(true);
    setValidationStatus("checking");
    setValidationMessage(null);
    try {
      const res = await fetch("/api/steam/check-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamLogin: login.trim() }),
      });
      const data = await res.json();
      const ok = Boolean(data.can_refill);
      setValidationStatus(ok ? "valid" : res.ok ? "invalid" : "unknown");
      setValidationMessage(
        ok ? "Аккаунт доступен для пополнения" : res.ok ? "Не удалось подтвердить логин" : "Проверка недоступна",
      );
    } catch {
      setValidationStatus("unknown");
      setValidationMessage("Проверка недоступна — можно продолжить оплату");
    } finally {
      setChecking(false);
    }
  }

  async function handlePay() {
    setError(null);
    if (!email.includes("@")) {
      setError("Укажите email");
      return;
    }
    if (!login.trim() || walletRub < 100 || !payment) {
      setError("Заполните все поля");
      return;
    }

    setPaying(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "STEAM",
          email: email.trim(),
          steamLogin: login.trim(),
          walletAmountRub: walletRub,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось создать заказ");
        return;
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      setError("Оплата временно недоступна. Номер заказа: " + data.orderId);
    } catch {
      setError("Ошибка сети");
    } finally {
      setPaying(false);
    }
  }

  const rateHint = rates?.rates?.RUB
    ? `Курс: ~${rates.rates.RUB.toFixed(2)} ₽ / $1`
    : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="card p-5 sm:p-6">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="mt-2 text-sm text-muted">
          Логин Steam и сумма зачисления на кошелёк.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Логин Steam</label>
            <div className="flex gap-2">
              <input
                className="input"
                value={login}
                onChange={(e) => {
                  setLogin(e.target.value);
                  setValidationStatus("idle");
                }}
                placeholder="your_steam_login"
                autoComplete="off"
              />
              <button
                type="button"
                className="btn btn-secondary shrink-0"
                onClick={checkLogin}
                disabled={checking || !login.trim()}
              >
                {checking ? "..." : "Проверить"}
              </button>
            </div>
            <ValidationHint status={validationStatus} message={validationMessage} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Сумма на кошелёк, ₽</label>
            <input
              type="number"
              className="input"
              min={100}
              step={50}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {[300, 500, 1000, 2000, 5000].map((v) => (
                <button
                  key={v}
                  type="button"
                  className="rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:border-accent hover:text-accent"
                  onClick={() => setAmount(String(v))}
                >
                  {formatRub(v)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:sticky lg:top-20">
        <div className="card p-4">
          <label className="mb-1.5 block text-sm font-medium">Email для чека</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@mail.ru"
          />
        </div>

        <aside className="card p-5">
        <h2 className="font-medium">К оплате</h2>
        {payment ? (
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">На кошелёк Steam</dt>
              <dd>{formatRub(payment.walletRub)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Комиссия ({payment.feePct}%)</dt>
              <dd>{formatRub(payment.feeRub)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <dt>Итого</dt>
              <dd className="text-accent">{formatRub(payment.totalRub)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-sm text-muted">Введите сумму</p>
        )}
        {rateHint && <p className="mt-3 text-xs text-muted">{rateHint}</p>}
        {error && <p className="mt-3 text-xs text-warning">{error}</p>}
        <button
          type="button"
          className="btn btn-primary mt-5 w-full"
          disabled={paying || !payment}
          onClick={handlePay}
        >
          {paying ? "..." : "Оплатить"}
        </button>
      </aside>
      </div>
    </div>
  );
}
