import { NextResponse } from "next/server";
import { getTicketForGuest, serializeTicket } from "@/lib/support/tickets";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const ticket = await getTicketForGuest(id, token);
  if (!ticket) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({ ticket: serializeTicket(ticket) });
}
