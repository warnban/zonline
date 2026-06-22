"use client";

import { useState } from "react";
import { useCreateOrder } from "@/components/checkout/use-create-order";
import { PaymentMethodPicker } from "@/components/payments/payment-method-picker";
import { DEFAULT_FREEKASSA_METHOD_ID } from "@/lib/payments/freekassa-methods";
import { PremiumRestrictionsNotice } from "@/components/telegram/premium-restrictions-notice";
import { TelegramUsernameField } from "@/components/telegram/telegram-username-field";

type Plan = { months: number; label: string; price: string; priceRub: number };

type Props = {
  heading: string;
  plans: Plan[];
};

export function TelegramPremiumForm({ heading, plans }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [months, setMonths] = useState(plans[0]?.months ?? 3);
  const [paymentMethodId, setPaymentMethodId] = useState(DEFAULT_FREEKASSA_METHOD_ID);
  const { pay, loading, error } = useCreateOrder();
  const selected = plans.find((p) => p.months === months);

  async function handlePay() {
    if (!email.includes("@") || !username.trim() || !selected) return;
    await pay({
      type: "TELEGRAM_PREMIUM",
      email: email.trim(),
      telegramUsername: username.trim(),
      months: selected.months,
      paymentMethodId,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="card p-5 sm:p-6">
          <h1 className="text-2xl font-semibold">{heading}</h1>
          <p className="mt-2 text-sm text-muted">Подписка оформляется на @username.</p>
          <div className="mt-6 space-y-4">
            <PremiumRestrictionsNotice />
            <TelegramUsernameField username={username} onUsernameChange={setUsername} />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Срок</label>
              <div className="grid grid-cols-3 gap-2">
                {plans.map((plan) => (
                  <button
                    key={plan.months}
                    type="button"
                    onClick={() => setMonths(plan.months)}
                    className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                      months === plan.months
                        ? "border-accent bg-accent-soft font-medium text-accent"
                        : "border-border text-muted hover:border-accent/40"
                    }`}
                  >
                    <span className="block">{plan.label}</span>
                    <span className="mt-1 block text-xs">{plan.price}</span>
                  </button>
                ))}
              </div>
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
        <div className="card p-4">
          <PaymentMethodPicker
            value={paymentMethodId}
            onChange={setPaymentMethodId}
            amountRub={selected?.priceRub}
          />
        </div>
        <aside className="card p-5">
        <h2 className="font-medium">К оплате</h2>
        {selected ? (
          <p className="mt-4 text-2xl font-semibold text-accent">{selected.price}</p>
        ) : (
          <p className="mt-4 text-sm text-muted">Выберите срок</p>
        )}
        {error && <p className="mt-2 text-xs text-warning">{error}</p>}
        <button
          type="button"
          className="btn btn-primary mt-5 w-full"
          disabled={loading || !selected || !email.includes("@")}
          onClick={handlePay}
        >
          {loading ? "Создаём заказ..." : "Оплатить"}
        </button>
      </aside>
      </div>
    </div>
  );
}
