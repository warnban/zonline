import Link from "next/link";
import { listAdminOrders } from "@/lib/admin/stats";
import { OrderRetryButton } from "@/components/admin/order-retry-button";
import { formatRub } from "@/lib/pricing";
import type { OrderStatus } from "@prisma/client";

export const metadata = { title: "Заказы · Admin", robots: { index: false } };

type Props = { searchParams: Promise<{ status?: string; q?: string }> };

const statuses: OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
];

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status, q } = await searchParams;
  const statusFilter = statuses.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined;
  const orders = await listAdminOrders({ status: statusFilter, q: q?.trim() });

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Заказы</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-md border px-2.5 py-1 text-xs ${!statusFilter ? "border-accent text-accent" : "border-border text-muted"}`}
        >
          Все
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-md border px-2.5 py-1 text-xs ${statusFilter === s ? "border-accent text-accent" : "border-border text-muted"}`}
          >
            {s}
          </Link>
        ))}
      </div>
      <form className="mb-4">
        <input name="q" defaultValue={q} className="input max-w-xs text-sm" placeholder="ID или email" />
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        <button type="submit" className="btn btn-secondary ml-2 text-sm">
          Найти
        </button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-surface-elevated text-xs text-muted">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Тип</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2">Fazer</th>
              <th className="px-3 py-2">Сумма</th>
              <th className="px-3 py-2">Дата</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <Link href={`/order/${o.publicId}`} className="text-accent hover:underline" target="_blank">
                    {o.publicId}
                  </Link>
                </td>
                <td className="px-3 py-2 text-muted">{o.email}</td>
                <td className="px-3 py-2">{o.type}</td>
                <td className="px-3 py-2">{o.status}</td>
                <td className="px-3 py-2 text-xs text-muted">{o.fazerOrderId ?? "—"}</td>
                <td className="px-3 py-2">{formatRub(Number(o.amountRub))}</td>
                <td className="px-3 py-2 text-xs text-muted">
                  {o.createdAt.toLocaleString("ru-RU")}
                </td>
                <td className="px-3 py-2">
                  {["PAID", "PROCESSING", "FAILED"].includes(o.status) && (
                    <OrderRetryButton publicId={o.publicId} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
