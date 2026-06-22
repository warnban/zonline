"use client";

import { useState } from "react";
import { BuyButton } from "@/components/checkout/buy-button";
import { formatRub } from "@/lib/pricing";

type Props = {
  orderType: "GIFT_CARD" | "GAME_KEY";
  categoryId: string;
  cardId: string;
  productName: string;
  priceRub: number;
};

export function ProductBuyCard({
  orderType,
  categoryId,
  cardId,
  productName,
  priceRub,
}: Props) {
  const [email, setEmail] = useState("");

  return (
    <div className="card p-4">
      <p className="font-medium">{productName}</p>
      <p className="mt-2 text-lg font-semibold text-accent">{formatRub(priceRub)}</p>
      <input
        type="email"
        className="input mt-4 text-sm"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div className="mt-3">
        <BuyButton
          disabled={!email.includes("@")}
          priceRub={priceRub}
          payload={{
            type: orderType,
            email: email.trim(),
            categoryId,
            cardId,
            productName,
          }}
        />
      </div>
    </div>
  );
}
