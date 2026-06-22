"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OrderRetryButton({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function retry() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${publicId}/retry`, { method: "POST" });
      const data = await res.json();
      setMsg(res.ok ? "Отправлено" : data.error ?? "Ошибка");
      router.refresh();
    } catch {
      setMsg("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        className="text-xs text-accent hover:underline"
        disabled={loading}
        onClick={retry}
      >
        {loading ? "..." : "Retry Fazer"}
      </button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </span>
  );
}
