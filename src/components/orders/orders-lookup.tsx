"use client";

import { useState } from "react";
import Link from "next/link";
import { formatRub } from "@/lib/pricing";

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: "Ожидает оплаты",
  PAID: "Оплачен",
  PROCESSING: "В обработке",
  COMPLETED: "Готово",
  FAILED: "Ошибка",
  REFUNDED: "Возврат",
};

type OrderItem = {
  publicId: string;
  status: string;
  amountRub: number;
  type: string;
  createdAt: string;
};

export function OrdersLookup() {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<OrderItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchOrders(emailValue: string) {
    const res = await fetch(`/api/orders/by-email?email=${encodeURIComponent(emailValue)}`);
    if (!res.ok) throw new Error("failed");
    return res.json() as Promise<{ items: OrderItem[] }>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await fetchOrders(email.trim());
      setOrders(data.items);
      document.cookie = `zynqo_email=${encodeURIComponent(email.trim())}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      setError("Не удалось загрузить заказы");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Мои заказы</h1>
        <p className="mt-2 text-sm text-muted">Введите email, указанный при покупке.</p>
      </div>

      <form onSubmit={handleSubmit} className="card flex gap-2 p-4">
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@mail.ru"
          required
        />
        <button type="submit" className="btn btn-primary shrink-0" disabled={loading}>
          {loading ? "..." : "Найти"}
        </button>
      </form>

      {error && <p className="text-sm text-warning">{error}</p>}

      {orders && orders.length === 0 && (
        <p className="text-sm text-muted">Заказов не найдено.</p>
      )}

      {orders && orders.length > 0 && (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.publicId}>
              <Link
                href={`/order/${o.publicId}`}
                className="card flex items-center justify-between p-4 transition-colors hover:border-accent/40"
              >
                <div>
                  <p className="font-medium">{o.publicId}</p>
                  <p className="text-xs text-muted">
                    {statusLabel[o.status] ?? o.status} ·{" "}
                    {new Date(o.createdAt).toLocaleString("ru-RU")}
                  </p>
                </div>
                <span className="text-sm font-medium">{formatRub(o.amountRub)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
