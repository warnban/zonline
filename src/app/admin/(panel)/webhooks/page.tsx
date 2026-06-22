import { db } from "@/lib/db";

export const metadata = { title: "Webhooks · Admin", robots: { index: false } };

export default async function AdminWebhooksPage() {
  const logs = await db.webhookLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Webhook logs</h1>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-surface-elevated text-xs text-muted">
            <tr>
              <th className="px-3 py-2">Время</th>
              <th className="px-3 py-2">Источник</th>
              <th className="px-3 py-2">Событие</th>
              <th className="px-3 py-2">OK</th>
              <th className="px-3 py-2">Ошибка</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-xs text-muted">
                  {log.createdAt.toLocaleString("ru-RU")}
                </td>
                <td className="px-3 py-2">{log.source}</td>
                <td className="px-3 py-2">{log.event}</td>
                <td className="px-3 py-2">{log.processed ? "✓" : "—"}</td>
                <td className="max-w-xs truncate px-3 py-2 text-xs text-warning">
                  {log.error ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
