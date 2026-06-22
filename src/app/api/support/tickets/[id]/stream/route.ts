import { db } from "@/lib/db";
import { getTicketForGuest } from "@/lib/support/tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const token = new URL(request.url).searchParams.get("token")?.trim();
  if (!token) {
    return new Response("token required", { status: 400 });
  }

  const ticket = await getTicketForGuest(id, token);
  if (!ticket) {
    return new Response("not found", { status: 404 });
  }

  let lastCount = ticket.messages.length;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send("init", { count: lastCount });

      const interval = setInterval(async () => {
        try {
          const fresh = await db.supportTicket.findFirst({
            where: { id, accessToken: token },
            include: { messages: { orderBy: { createdAt: "asc" } } },
          });
          if (!fresh) {
            clearInterval(interval);
            controller.close();
            return;
          }

          if (fresh.messages.length !== lastCount) {
            lastCount = fresh.messages.length;
            send("messages", {
              status: fresh.status,
              messages: fresh.messages.map((m) => ({
                id: m.id,
                body: m.body,
                isAdmin: m.isAdmin,
                createdAt: m.createdAt.toISOString(),
              })),
            });
          } else {
            send("ping", { t: Date.now() });
          }
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 3000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
