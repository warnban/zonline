import { NextResponse } from "next/server";
import { z } from "zod";
import type { TicketStatus } from "@prisma/client";
import { requireAdminSession, unauthorizedResponse } from "@/lib/admin/require";
import {
  addAdminMessage,
  getTicketById,
  serializeTicket,
  updateTicketStatus,
} from "@/lib/support/tickets";

type Params = { params: Promise<{ id: string }> };

const messageSchema = z.object({ body: z.string().min(1).max(4000) });
const statusSchema = z.object({ status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED"]) });

export async function POST(request: Request, { params }: Params) {
  if (!(await requireAdminSession())) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const message = await addAdminMessage(id, parsed.data.body);
  if (!message) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const ticket = await getTicketById(id);
  return NextResponse.json({
    message: {
      id: message.id,
      body: message.body,
      isAdmin: message.isAdmin,
      createdAt: message.createdAt.toISOString(),
    },
    ticket: ticket ? serializeTicket(ticket) : null,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  if (!(await requireAdminSession())) return unauthorizedResponse();

  const { id } = await params;
  const body = await request.json();
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  try {
    await updateTicketStatus(id, parsed.data.status as TicketStatus);
    const ticket = await getTicketById(id);
    return NextResponse.json({ ticket: ticket ? serializeTicket(ticket) : null });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
