"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
};

type Ticket = {
  id: string;
  email: string | null;
  subject: string | null;
  status: string;
  messages: Message[];
};

const statusOptions = ["OPEN", "IN_PROGRESS", "CLOSED"] as const;

export function AdminTicketChat({ ticket: initial }: { ticket: Ticket }) {
  const [ticket, setTicket] = useState(initial);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.messages.length]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ticket) setTicket(data.ticket);
      setReply("");
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(status: string) {
    await fetch(`/api/admin/support/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setTicket((t) => ({ ...t, status }));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div className="card flex flex-col p-4">
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          {statusOptions.map((s) => (
            <button
              key={s}
              type="button"
              className={`rounded-md border px-2 py-1 text-xs ${
                ticket.status === s ? "border-accent bg-accent-soft text-accent" : "border-border"
              }`}
              onClick={() => setStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="max-h-[420px] flex-1 space-y-2 overflow-y-auto">
          {ticket.messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                m.isAdmin
                  ? "ml-auto bg-accent-soft"
                  : "mr-auto border border-border bg-surface-elevated"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className="mt-1 text-[10px] text-muted">
                {new Date(m.createdAt).toLocaleString("ru-RU")}
              </p>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form onSubmit={sendReply} className="mt-4 flex gap-2">
          <input
            className="input text-sm"
            placeholder="Ответ..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <button type="submit" className="btn btn-primary shrink-0" disabled={loading}>
            →
          </button>
        </form>
      </div>
      <aside className="card space-y-2 p-4 text-sm">
        <p className="font-medium">{ticket.subject ?? "Обращение"}</p>
        <p className="text-muted">{ticket.email}</p>
        <p className="text-xs text-muted">ID: {ticket.id}</p>
      </aside>
    </div>
  );
}
