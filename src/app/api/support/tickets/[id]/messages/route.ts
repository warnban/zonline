import { NextResponse } from "next/server";
import { z } from "zod";
import { addGuestMessage, getTicketForGuest, serializeTicket } from "@/lib/support/tickets";

type Params = { params: Promise<{ id: string }> };

const messageSchema = z.object({
  token: z.string().min(1),
  body: z.string().min(1).max(4000),
});

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const json = await request.json();
  const parsed = messageSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const message = await addGuestMessage(id, parsed.data.token, parsed.data.body);
  if (!message) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const ticket = await getTicketForGuest(id, parsed.data.token);
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
