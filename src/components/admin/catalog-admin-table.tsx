"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = { id: string; name: string; type: string; enabled: boolean };

export function CatalogAdminTable({ items }: { items: Item[] }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function syncCatalog() {
    setSyncing(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/catalog/sync", { method: "POST" });
      const data = await res.json();
      setMsg(res.ok ? `Синхронизировано: ${data.synced ?? 0}` : "Ошибка");
      router.refresh();
    } catch {
      setMsg("Ошибка сети");
    } finally {
      setSyncing(false);
    }
  }

  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/admin/catalog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={syncCatalog} disabled={syncing}>
          {syncing ? "..." : "Синхронизировать с FazerCards"}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-surface-elevated text-xs text-muted">
            <tr>
              <th className="px-3 py-2">Название</th>
              <th className="px-3 py-2">Тип</th>
              <th className="px-3 py-2">Статус</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2 text-muted">{item.type}</td>
                <td className="px-3 py-2">{item.enabled ? "Вкл" : "Выкл"}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-xs text-accent hover:underline"
                    onClick={() => toggle(item.id, item.enabled)}
                  >
                    {item.enabled ? "Скрыть" : "Показать"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
