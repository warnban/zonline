import Link from "next/link";
import { listAllSupportTickets } from "@/lib/support/tickets";
import type { TicketStatus } from "@prisma/client";

export const metadata = { title: "Поддержка · Admin", robots: { index: false } };

type Props = { searchParams: Promise<{ status?: string }> };

const statuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "CLOSED"];

export default async function AdminSupportPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const filter = statuses.includes(status as TicketStatus) ? (status as TicketStatus) : undefined;
  const tickets = await listAllSupportTickets(filter);

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Поддержка</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/support" className={`rounded-md border px-2.5 py-1 text-xs ${!filter ? "border-accent text-accent" : "border-border text-muted"}`}>
          Все
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/support?status=${s}`}
            className={`rounded-md border px-2.5 py-1 text-xs ${filter === s ? "border-accent text-accent" : "border-border text-muted"}`}
          >
            {s}
          </Link>
        ))}
      </div>
      <ul className="space-y-2">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link
              href={`/admin/support/${t.id}`}
              className="card flex items-center justify-between p-4 transition-colors hover:border-accent/40"
            >
              <div>
                <p className="font-medium">{t.subject ?? "Обращение"}</p>
                <p className="text-xs text-muted">
                  {t.guestEmail} · {t.status} · {t.updatedAt.toLocaleString("ru-RU")}
                </p>
              </div>
              <span className="text-xs text-muted">{t.messages[0]?.body.slice(0, 60)}</span>
            </Link>
          </li>
        ))}
        {tickets.length === 0 && <p className="text-sm text-muted">Тикетов нет</p>}
      </ul>
    </>
  );
}
