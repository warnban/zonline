"use client";

import { useState } from "react";

type Props = {
  usdRubRate: number;
  defaultMarkupPct: number;
  steamCommissionPct: number;
};

export function PricingSettingsForm({
  usdRubRate,
  defaultMarkupPct,
  steamCommissionPct,
}: Props) {
  const [form, setForm] = useState({
    usdRubRate: String(usdRubRate),
    defaultMarkupPct: String(defaultMarkupPct),
    steamCommissionPct: String(steamCommissionPct),
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usdRubRate: Number(form.usdRubRate),
          defaultMarkupPct: Number(form.defaultMarkupPct),
          steamCommissionPct: Number(form.steamCommissionPct),
        }),
      });
      setMsg(res.ok ? "Сохранено" : "Ошибка сохранения");
    } catch {
      setMsg("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="card max-w-md space-y-4 p-5">
      <h2 className="font-medium">Цены</h2>
      <div>
        <label className="mb-1 block text-xs text-muted">USD → RUB (курс, не наценка)</label>
        <input
          className="input"
          type="number"
          step="0.01"
          value={form.usdRubRate}
          onChange={(e) => setForm((f) => ({ ...f, usdRubRate: e.target.value }))}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Наценка, % (кроме Steam)</label>
        <input
          className="input"
          type="number"
          step="0.1"
          value={form.defaultMarkupPct}
          onChange={(e) => setForm((f) => ({ ...f, defaultMarkupPct: e.target.value }))}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted">Комиссия Steam, %</label>
        <input
          className="input"
          type="number"
          step="0.1"
          value={form.steamCommissionPct}
          onChange={(e) => setForm((f) => ({ ...f, steamCommissionPct: e.target.value }))}
        />
      </div>
      {msg && <p className="text-sm text-muted">{msg}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? "..." : "Сохранить"}
      </button>
    </form>
  );
}
