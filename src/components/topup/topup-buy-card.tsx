"use client";

import { useState } from "react";
import { BuyButton } from "@/components/checkout/buy-button";
import { ValidationHint, type ValidationStatus } from "@/components/checkout/validation-hint";
import { formatRub } from "@/lib/pricing";
import type { TopupOffer } from "@/lib/fazercards/catalog";

type Props = {
  categoryId: string;
  offer: TopupOffer;
  priceRub: number;
  productName: string;
};

export function TopupBuyCard({ categoryId, offer, priceRub, productName }: Props) {
  const [email, setEmail] = useState("");
  const fieldsDef = offer.fields ?? [];
  const [fields, setFields] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("idle");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const allFilled =
    email.includes("@") &&
    fieldsDef.every((f) => !f.required || (fields[f.key]?.trim()?.length ?? 0) > 0);

  async function validateFields() {
    if (!allFilled) return;
    setChecking(true);
    setValidationStatus("checking");
    setValidationMessage(null);
    try {
      const res = await fetch("/api/topups/validate-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, offerId: String(offer.offer_id), fields }),
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
    <div className="card p-4">
      <p className="font-medium">{offer.name ?? offer.offer_id}</p>
      <p className="mt-2 text-lg font-semibold text-accent">{formatRub(priceRub)}</p>

      <div className="mt-4 space-y-3">
        {fieldsDef.map((f) => (
          <div key={f.key}>
            <label className="mb-1 block text-xs font-medium">{f.label ?? f.key}</label>
            <input
              className="input text-sm"
              value={fields[f.key] ?? ""}
              onChange={(e) => {
                setFields((prev) => ({ ...prev, [f.key]: e.target.value }));
                setValidationStatus("idle");
              }}
              placeholder={f.label ?? f.key}
            />
          </div>
        ))}
        <div>
          <label className="mb-1 block text-xs font-medium">Email</label>
          <input
            type="email"
            className="input text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@mail.ru"
          />
        </div>
      </div>

      {fieldsDef.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            className="btn btn-secondary w-full text-sm"
            disabled={checking || !allFilled}
            onClick={validateFields}
          >
            {checking ? "..." : "Проверить ID"}
          </button>
          <ValidationHint status={validationStatus} message={validationMessage} />
        </div>
      )}

      <div className="mt-4">
        <BuyButton
          disabled={!allFilled}
          priceRub={priceRub}
          payload={{
            type: "TOPUP",
            email: email.trim(),
            categoryId,
            offerId: String(offer.offer_id),
            fields,
            productName,
          }}
        />
      </div>
    </div>
  );
}
