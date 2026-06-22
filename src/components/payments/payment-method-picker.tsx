"use client";

import { FREEKASSA_PAYMENT_METHODS } from "@/lib/payments/freekassa-methods";

type Props = {
  value: number;
  onChange: (id: number) => void;
  amountRub?: number;
};

export function PaymentMethodPicker({ value, onChange, amountRub }: Props) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">Способ оплаты</label>
      <div className="grid gap-2">
        {FREEKASSA_PAYMENT_METHODS.map((method) => {
          const active = value === method.id;
          const usdtMinRub = method.minUsdt && amountRub ? method.minUsdt * 100 : null;
          const belowMin =
            method.minUsdt && amountRub != null && amountRub < (usdtMinRub ?? 0);

          return (
            <button
              key={method.id}
              type="button"
              disabled={Boolean(belowMin)}
              onClick={() => onChange(method.id)}
              className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                active
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border text-muted hover:border-accent/40"
              } ${belowMin ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <span className="font-medium text-foreground">{method.label}</span>
              {method.feeNote && (
                <span className="mt-0.5 block text-xs text-muted">{method.feeNote}</span>
              )}
              {belowMin && method.minUsdt && (
                <span className="mt-0.5 block text-xs text-warning">
                  Минимум ~{method.minUsdt} USDT для этой суммы
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
