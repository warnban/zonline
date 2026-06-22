import type { TicketStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { sendSupportNotificationEmail } from "@/lib/email/support";

export type CreateTicketInput = {
  email: string;
  name?: string;
  phone?: string;
  subject?: string;
  body: string;
};

export async function createSupportTicket(input: CreateTicketInput) {
  const email = input.email.toLowerCase().trim();

  const ticket = await db.supportTicket.create({
    data: {
      guestEmail: email,
      guestName: input.name?.trim() || null,
      guestPhone: input.phone?.trim() || null,
      subject: input.subject?.trim() || "Обращение с сайта",
      messages: {
        create: {
          body: input.body.trim(),
          isAdmin: false,
        },
      },
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  await sendSupportNotificationEmail({
    ticketId: ticket.id,
    email,
    subject: ticket.subject ?? "Обращение",
    body: input.body.trim(),
    isReply: false,
  }).catch(console.error);

  return ticket;
}

export async function listTicketsByEmail(email: string) {
  return db.supportTicket.findMany({
    where: { guestEmail: email.toLowerCase().trim() },
    orderBy: { updatedAt: "desc" },
    take: 30,
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function getTicketForGuest(ticketId: string, accessToken: string) {
  return db.supportTicket.findFirst({
    where: { id: ticketId, accessToken },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
}

export async function addGuestMessage(ticketId: string, accessToken: string, body: string) {
  const ticket = await db.supportTicket.findFirst({
    where: { id: ticketId, accessToken },
  });
  if (!ticket) return null;

  const [message] = await db.$transaction([
    db.supportMessage.create({
      data: {
        ticketId,
        body: body.trim(),
        isAdmin: false,
      },
    }),
    db.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: ticket.status === "CLOSED" ? "OPEN" : ticket.status,
        updatedAt: new Date(),
      },
    }),
  ]);

  await sendSupportNotificationEmail({
    ticketId,
    email: ticket.guestEmail ?? "",
    subject: ticket.subject ?? "Обращение",
    body: body.trim(),
    isReply: false,
  }).catch(console.error);

  return message;
}

export async function addAdminMessage(ticketId: string, body: string) {
  const ticket = await db.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return null;

  const message = await db.supportMessage.create({
    data: {
      ticketId,
      body: body.trim(),
      isAdmin: true,
    },
  });

  await db.supportTicket.update({
    where: { id: ticketId },
    data: { status: "IN_PROGRESS", updatedAt: new Date() },
  });

  if (ticket.guestEmail) {
    const { sendSupportReplyToUserEmail } = await import("@/lib/email/support");
    await sendSupportReplyToUserEmail({
      ticketId,
      email: ticket.guestEmail,
      subject: ticket.subject ?? "Обращение",
      body: body.trim(),
    }).catch(console.error);
  }

  return message;
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  return db.supportTicket.update({
    where: { id: ticketId },
    data: { status },
  });
}

export async function listAllSupportTickets(status?: TicketStatus) {
  return db.supportTicket.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getTicketById(ticketId: string) {
  return db.supportTicket.findUnique({
    where: { id: ticketId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export function serializeTicket(ticket: {
  id: string;
  accessToken: string;
  guestEmail: string | null;
  guestName: string | null;
  subject: string | null;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
  messages?: Array<{
    id: string;
    body: string;
    isAdmin: boolean;
    createdAt: Date;
  }>;
}) {
  return {
    id: ticket.id,
    accessToken: ticket.accessToken,
    email: ticket.guestEmail,
    name: ticket.guestName,
    subject: ticket.subject,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    messages:
      ticket.messages?.map((m) => ({
        id: m.id,
        body: m.body,
        isAdmin: m.isAdmin,
        createdAt: m.createdAt.toISOString(),
      })) ?? [],
  };
}

export function saveGuestTicketAccess(ticketId: string, accessToken: string) {
  if (typeof window === "undefined") return;
  const stored = readGuestTickets();
  stored[ticketId] = accessToken;
  localStorage.setItem("zynqo_support_tickets", JSON.stringify(stored));
}

export function readGuestTickets(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("zynqo_support_tickets") ?? "{}") as Record<
      string,
      string
    >;
  } catch {
    return {};
  }
}
