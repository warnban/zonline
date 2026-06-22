"use client";

import { useState } from "react";
import { BuyButton } from "@/components/checkout/buy-button";
import { ValidationHint, type ValidationStatus } from "@/components/checkout/validation-hint";
import { formatRub } from "@/lib/pricing";
import type { FieldDef, TopupOffer } from "@/lib/fazercards/catalog";

export type TopupOfferOption = {
  offerId: string;
  name: string;
  priceRub: number;
};

type Props = {
  categoryId: string;
  categoryName: string;
  offers: TopupOfferOption[];
  fieldsDef: FieldDef[];
  rawOffers: TopupOffer[];
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

export function GameTopupCheckout({
  categoryId,
  categoryName,
  offers,
  fieldsDef,
  rawOffers,
}: Props) {
  const [selectedId, setSelectedId] = useState(offers[0]?.offerId ?? "");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("idle");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const selected = offers.find((o) => o.offerId === selectedId);
  const selectedRaw = rawOffers.find((o) => String(o.offer_id) === selectedId);

  const fieldsReady =
    fieldsDef.length === 0 ||
    fieldsDef.every((f) => !f.required || (fields[f.key]?.trim()?.length ?? 0) > 0);
  const emailReady = email.includes("@");
  const canPay = Boolean(selected && fieldsReady && emailReady);

  async function validateFields() {
    if (!fieldsReady || !selectedRaw) return;
    setChecking(true);
    setValidationStatus("checking");
    setValidationMessage(null);
    try {
      const res = await fetch("/api/topups/validate-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          offerId: String(selectedRaw.offer_id),
          fields,
        }),
      });
      const data = await res.json();
      if (data.valid === true) {
        setValidationStatus("valid");
        setValidationMessage(data.message || "ID подтверждён");
      } else if (data.valid === false) {
        setValidationStatus("invalid");
        setValidationMessage(data.message || "ID не найден");
      } else {
        setValidationStatus("unknown");
        setValidationMessage(data.message || "Проверка недоступна");
      }
    } catch {
      setValidationStatus("unknown");
      setValidationMessage("Проверка недоступна — можно продолжить оплату");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        {fieldsDef.length > 0 && (
          <section className="card p-5 sm:p-6">
            <StepBadge n={1} title="Данные аккаунта" />
            <div className="space-y-3">
              {fieldsDef.map((f) => (
                <div key={f.key}>
                  <label className="mb-1.5 block text-sm font-medium">{f.label ?? f.key}</label>
                  <input
                    className="input"
                    value={fields[f.key] ?? ""}
                    onChange={(e) => {
                      setFields((prev) => ({ ...prev, [f.key]: e.target.value }));
                      setValidationStatus("idle");
                    }}
                    placeholder={f.label ?? f.key}
                  />
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary w-full sm:w-auto"
                disabled={checking || !fieldsReady}
                onClick={validateFields}
              >
                {checking ? "Проверка…" : "Проверить ID"}
              </button>
              <ValidationHint status={validationStatus} message={validationMessage} />
            </div>
          </section>
        )}

        <section className="card p-5 sm:p-6">
          <StepBadge n={fieldsDef.length > 0 ? 2 : 1} title="Выберите номинал" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {offers.map((offer) => (
              <button
                key={offer.offerId}
                type="button"
                onClick={() => setSelectedId(offer.offerId)}
                className={`rounded-xl border px-3 py-3 text-left transition-all ${
                  selectedId === offer.offerId
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
            <dd className="text-right font-medium">{categoryName}</dd>
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
              type: "TOPUP",
              email: email.trim(),
              categoryId,
              offerId: selectedId,
              fields,
              productName: `${categoryName} — ${selected?.name ?? ""}`,
            }}
          />
        </div>
      </aside>
      </div>
    </div>
  );
}
