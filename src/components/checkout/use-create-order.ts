"use client";

import { useState } from "react";

export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(payload: Record<string, unknown>) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : "Не удалось создать заказ";
        setError(msg);
        return null;
      }
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
      return data as { orderId: string; paymentUrl?: string };
    } catch {
      setError("Ошибка сети");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { pay, loading, error, setError };
}
