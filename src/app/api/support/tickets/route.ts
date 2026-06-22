import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupportTicket, listTicketsByEmail, serializeTicket } from "@/lib/support/tickets";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
  phone: z.string().max(32).optional(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(4000),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const ticket = await createSupportTicket(parsed.data);
  return NextResponse.json({ ticket: serializeTicket(ticket) });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const tickets = await listTicketsByEmail(email);
  return NextResponse.json({
    items: tickets.map((t) =>
      serializeTicket({
        ...t,
        accessToken: t.accessToken,
        messages: t.messages,
      }),
    ),
  });
}
