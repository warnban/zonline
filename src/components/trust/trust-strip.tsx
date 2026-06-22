const items = [
  { label: "Быстро", desc: "обычно до 5 минут" },
  { label: "Из РФ", desc: "карта и СБП" },
  { label: "Поддержка", desc: "чат на сайте" },
  { label: "Без аккаунта", desc: "нужен только email" },
];

export function TrustStrip() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-surface-elevated px-3 py-2.5">
          <span className="text-sm font-medium">{item.label}</span>
          <span className="mt-0.5 block text-xs text-muted">{item.desc}</span>
        </div>
      ))}
    </div>
  );
}
