"use client";

import { useCreateOrder } from "@/components/checkout/use-create-order";
import { formatRub } from "@/lib/pricing";

type Props = {
  payload: Record<string, unknown>;
  priceRub: number;
  label?: string;
  disabled?: boolean;
};

export function BuyButton({ payload, priceRub, label = "Оплатить", disabled }: Props) {
  const { pay, loading, error } = useCreateOrder();

  return (
    <div>
      {error && <p className="mb-2 text-xs text-warning">{error}</p>}
      <button
        type="button"
        className="btn btn-primary w-full text-sm"
        disabled={disabled || loading || priceRub <= 0}
        onClick={() => pay(payload)}
      >
        {loading ? "..." : `${label} · ${formatRub(priceRub)}`}
      </button>
    </div>
  );
}
