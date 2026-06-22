export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h1 className="text-xl font-semibold">{title}</h1>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      <p className="mt-4 text-sm text-muted">Раздел в разработке — Этап 2.</p>
    </div>
  );
}
