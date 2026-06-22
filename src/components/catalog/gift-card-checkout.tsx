"use client";

import { useState } from "react";
import { BuyButton } from "@/components/checkout/buy-button";
import { formatRub } from "@/lib/pricing";

export type GiftCardOption = {
  cardId: string;
  name: string;
  priceRub: number;
};

type Props = {
  categoryId: string;
  productTitle: string;
  offers: GiftCardOption[];
};

function StepBadge({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-semibold text-white">
        {n}
      </span>
      <span className="text-sm font-medium">{title}</span>
    </div>
  );
}

export function GiftCardCheckout({ categoryId, productTitle, offers }: Props) {
  const [selectedId, setSelectedId] = useState(offers[0]?.cardId ?? "");
  const [email, setEmail] = useState("");

  const selected = offers.find((o) => o.cardId === selectedId);
  const canPay = Boolean(selected && email.includes("@"));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <section className="card p-5 sm:p-6">
          <StepBadge n={1} title="Выберите номинал" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {offers.map((offer) => (
              <button
                key={offer.cardId}
                type="button"
                onClick={() => setSelectedId(offer.cardId)}
                className={`rounded-xl border px-3 py-3 text-left transition-all ${
                  selectedId === offer.cardId
                    ? "border-accent bg-accent-soft ring-1 ring-accent/30"
                    : "border-border hover:border-accent/40"
                }`}
              >
                <span className="block text-sm font-medium">{offer.name}</span>
                <span className="mt-1 block text-xs text-accent">{formatRub(offer.priceRub)}</span>
              </button>
            ))}
          </div>
        </section>
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
        <h2 className="font-medium">Сводка</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Товар</dt>
            <dd className="text-right font-medium">{productTitle}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted">Номинал</dt>
            <dd className="text-right">{selected?.name ?? "—"}</dd>
          </div>
        </dl>
        {selected && (
          <p className="mt-4 text-2xl font-semibold text-accent">{formatRub(selected.priceRub)}</p>
        )}
        <div className="mt-5">
          <BuyButton
            disabled={!canPay}
            priceRub={selected?.priceRub ?? 0}
            label="Продолжить"
            payload={{
              type: "GIFT_CARD",
              email: email.trim(),
              categoryId,
              cardId: selectedId,
              productName: `${productTitle} — ${selected?.name ?? ""}`,
            }}
          />
        </div>
      </aside>
      </div>
    </div>
  );
}
