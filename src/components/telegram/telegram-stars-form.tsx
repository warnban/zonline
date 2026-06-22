"use client";

import { useMemo, useState } from "react";
import { useCreateOrder } from "@/components/checkout/use-create-order";
import { TelegramUsernameField } from "@/components/telegram/telegram-username-field";
import { PaymentMethodPicker } from "@/components/payments/payment-method-picker";
import { DEFAULT_FREEKASSA_METHOD_ID } from "@/lib/payments/freekassa-methods";
import { formatRub } from "@/lib/pricing";

type Props = {
  heading: string;
  minAmount: number;
  maxAmount: number;
  pricePerStarRub?: number | null;
  priceLabel?: string;
};

export function TelegramStarsForm({
  heading,
  minAmount,
  maxAmount,
  pricePerStarRub,
  priceLabel,
}: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(String(minAmount));
  const [paymentMethodId, setPaymentMethodId] = useState(DEFAULT_FREEKASSA_METHOD_ID);
  const { pay, loading, error } = useCreateOrder();

  const qty = parseInt(quantity, 10) || 0;
  const totalRub = useMemo(() => {
    if (!pricePerStarRub || qty <= 0) return null;
    return qty * pricePerStarRub;
  }, [qty, pricePerStarRub]);

  async function handlePay() {
    if (!email.includes("@") || !username.trim() || !totalRub) return;
    await pay({
      type: "TELEGRAM_STARS",
      email: email.trim(),
      telegramUsername: username.trim(),
      quantity: qty,
      paymentMethodId,
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card p-5 sm:p-6">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="mt-2 text-sm text-muted">
          Укажите @username и количество звёзд ({minAmount}–{maxAmount}).
        </p>
        <div className="mt-6 space-y-4">
          <TelegramUsernameField username={username} onUsernameChange={setUsername} />
          <div>
            <label className="mb-1.5 block text-sm font-medium">Количество звёзд</label>
            <input type="number" className="input" min={minAmount} max={maxAmount} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="space-y-3 lg:sticky lg:top-20">
        <div className="card p-4">
          <label className="mb-1.5 block text-sm font-medium">Email для чека</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mail.ru" />
        </div>
        <div className="card p-4">
          <PaymentMethodPicker
            value={paymentMethodId}
            onChange={setPaymentMethodId}
            amountRub={totalRub ?? undefined}
          />
        </div>
        <aside className="card p-5">
        <h2 className="font-medium">К оплате</h2>
        {priceLabel && <p className="mt-1 text-xs text-muted">{priceLabel}</p>}
        {totalRub ? (
          <p className="mt-4 text-2xl font-semibold text-accent">{formatRub(totalRub)}</p>
        ) : (
          <p className="mt-4 text-sm text-muted">Цена загружается...</p>
        )}
        {error && <p className="mt-2 text-xs text-warning">{error}</p>}
        <button type="button" className="btn btn-primary mt-5 w-full" disabled={loading || !totalRub || !email.includes("@")} onClick={handlePay}>
          {loading ? "Создаём заказ..." : "Оплатить"}
        </button>
      </aside>
      </div>
    </div>
  );
}
