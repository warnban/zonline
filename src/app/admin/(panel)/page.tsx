import Link from "next/link";
import { getFazerBalance } from "@/lib/fazercards/catalog";
import { getAdminDashboardStats } from "@/lib/admin/stats";
import { formatRub } from "@/lib/pricing";

export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminDashboardPage() {
  const [stats, balance] = await Promise.all([
    getAdminDashboardStats(),
    getFazerBalance().catch(() => null),
  ]);

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs text-muted">Заказов сегодня</p>
          <p className="mt-1 text-2xl font-semibold">{stats.ordersToday}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Выручка сегодня</p>
          <p className="mt-1 text-2xl font-semibold">{formatRub(stats.revenueToday)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Открытых тикетов</p>
          <p className="mt-1 text-2xl font-semibold">{stats.openTickets}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted">Баланс FazerCards</p>
          <p className="mt-1 text-2xl font-semibold">
            {balance ? `$${balance.balance}` : "—"}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-medium">Последние заказы</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-surface-elevated text-xs text-muted">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Тип</th>
                <th className="px-3 py-2">Статус</th>
                <th className="px-3 py-2">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((o) => (
                <tr key={o.publicId} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <Link href={`/admin/orders?q=${o.publicId}`} className="text-accent hover:underline">
                      {o.publicId}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted">{o.email}</td>
                  <td className="px-3 py-2">{o.type}</td>
                  <td className="px-3 py-2">{o.status}</td>
                  <td className="px-3 py-2">{formatRub(Number(o.amountRub))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
