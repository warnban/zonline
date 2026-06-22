import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminTicketChat } from "@/components/admin/admin-ticket-chat";
import { getTicketById, serializeTicket } from "@/lib/support/tickets";

export const metadata = { title: "Тикет · Admin", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function AdminSupportTicketPage({ params }: Props) {
  const { id } = await params;
  const ticket = await getTicketById(id);
  if (!ticket) notFound();

  const serialized = serializeTicket(ticket);

  return (
    <>
      <Link href="/admin/support" className="mb-4 inline-block text-sm text-muted hover:text-accent">
        ← Все тикеты
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">{ticket.subject ?? "Обращение"}</h1>
      <AdminTicketChat ticket={serialized} />
    </>
  );
}
