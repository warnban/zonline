import type { Metadata } from "next";

export const metadata: Metadata = { title: "Поддержка" };

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Поддержка</h1>
      <p className="text-sm text-muted">
        Используйте виджет чата в правом нижнем углу. Email: support@zynqo.ru
      </p>
    </div>
  );
}
