"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { readGuestTickets, saveGuestTicketAccess } from "@/lib/support/tickets";

type Message = {
  id: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
};

type Ticket = {
  id: string;
  accessToken: string;
  email: string | null;
  name: string | null;
  subject: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
};

type View = "home" | "new" | "chat" | "history";

const statusLabel: Record<string, string> = {
  OPEN: "Открыт",
  IN_PROGRESS: "В работе",
  CLOSED: "Закрыт",
};

function readCookieEmail() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)zynqo_email=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function SupportWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("home");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [history, setHistory] = useState<Ticket[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEmail(readCookieEmail());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length, open]);

  const openTicket = useCallback(async (ticketId: string, token: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/support/tickets/${ticketId}?token=${encodeURIComponent(token)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      setTicket(data.ticket);
      saveGuestTicketAccess(ticketId, token);
      setView("chat");
    } catch {
      setError("Не удалось открыть обращение");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !ticket) return;

    const es = new EventSource(
      `/api/support/tickets/${ticket.id}/stream?token=${encodeURIComponent(ticket.accessToken)}`,
    );

    es.addEventListener("messages", (ev) => {
      const data = JSON.parse((ev as MessageEvent).data) as {
        status: string;
        messages: Message[];
      };
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              status: data.status,
              messages: data.messages,
            }
          : prev,
      );
    });

    return () => es.close();
  }, [open, ticket?.id, ticket?.accessToken]);

  async function loadHistory() {
    if (!email.includes("@")) {
      setError("Укажите email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/support/tickets?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      setHistory(data.items ?? []);
      setView("history");
      document.cookie = `zynqo_email=${encodeURIComponent(email.trim())}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      setError("Не удалось загрузить историю");
    } finally {
      setLoading(false);
    }
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || !body.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
          subject: subject.trim() || undefined,
          body: body.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      setTicket(data.ticket);
      saveGuestTicketAccess(data.ticket.id, data.ticket.accessToken);
      document.cookie = `zynqo_email=${encodeURIComponent(email.trim())}; path=/; max-age=31536000; SameSite=Lax`;
      setBody("");
      setView("chat");
    } catch {
      setError("Не удалось отправить обращение");
    } finally {
      setLoading(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket || !reply.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: ticket.accessToken, body: reply.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      if (data.ticket) setTicket(data.ticket);
      setReply("");
    } catch {
      setError("Не удалось отправить сообщение");
    } finally {
      setLoading(false);
    }
  }

  function openStoredTickets() {
    const stored = readGuestTickets();
    const ids = Object.entries(stored);
    if (ids.length === 1) {
      openTicket(ids[0][0], ids[0][1]);
      return;
    }
    if (email.includes("@")) {
      loadHistory();
      return;
    }
    setView("new");
  }

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Поддержка"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) setView("home");
        }}
        className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg hover:bg-accent-hover md:bottom-6"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {open && (
        <div className="fixed bottom-36 right-4 z-40 flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg md:bottom-20">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="font-medium">Поддержка</p>
              <p className="text-xs text-muted">support@zynqo.ru</p>
            </div>
            <button
              type="button"
              className="text-muted hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </header>

          <div className="max-h-[min(60vh,480px)] overflow-y-auto p-4">
            {error && <p className="mb-3 text-xs text-warning">{error}</p>}

            {view === "home" && (
              <div className="space-y-3">
                <p className="text-sm text-muted">Задайте вопрос — ответим в этом чате.</p>
                <button type="button" className="btn btn-primary w-full" onClick={() => setView("new")}>
                  Новое обращение
                </button>
                <button type="button" className="btn btn-secondary w-full" onClick={openStoredTickets}>
                  История обращений
                </button>
              </div>
            )}

            {view === "new" && (
              <form onSubmit={createTicket} className="space-y-3">
                <input
                  className="input text-sm"
                  placeholder="Email *"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  className="input text-sm"
                  placeholder="Имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  className="input text-sm"
                  placeholder="Телефон"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <input
                  className="input text-sm"
                  placeholder="Тема"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <textarea
                  className="input min-h-24 text-sm"
                  placeholder="Сообщение *"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <button type="button" className="btn btn-secondary flex-1" onClick={() => setView("home")}>
                    Назад
                  </button>
                  <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                    {loading ? "..." : "Отправить"}
                  </button>
                </div>
              </form>
            )}

            {view === "history" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    className="input text-sm"
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="button" className="btn btn-secondary shrink-0" onClick={loadHistory} disabled={loading}>
                    {loading ? "..." : "Найти"}
                  </button>
                </div>
                {history.length === 0 ? (
                  <p className="text-sm text-muted">Обращений не найдено.</p>
                ) : (
                  <ul className="space-y-2">
                    {history.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          className="w-full rounded-md border border-border px-3 py-2 text-left text-sm hover:border-accent/40"
                          onClick={() => openTicket(t.id, t.accessToken)}
                        >
                          <p className="font-medium">{t.subject ?? "Обращение"}</p>
                          <p className="text-xs text-muted">
                            {statusLabel[t.status] ?? t.status} ·{" "}
                            {new Date(t.updatedAt).toLocaleString("ru-RU")}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" className="btn btn-secondary w-full" onClick={() => setView("home")}>
                  Назад
                </button>
              </div>
            )}

            {view === "chat" && ticket && (
              <div className="flex flex-col gap-3">
                <div className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs text-muted">
                  {ticket.subject ?? "Обращение"} · {statusLabel[ticket.status] ?? ticket.status}
                </div>
                <div className="space-y-2">
                  {(ticket.messages ?? []).map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[90%] rounded-md px-3 py-2 text-sm ${
                        m.isAdmin
                          ? "mr-auto bg-accent-soft text-foreground"
                          : "ml-auto bg-surface-elevated border border-border"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.body}</p>
                      <p className="mt-1 text-[10px] text-muted">
                        {new Date(m.createdAt).toLocaleString("ru-RU")}
                      </p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                {ticket.status !== "CLOSED" && (
                  <form onSubmit={sendReply} className="flex gap-2">
                    <input
                      className="input text-sm"
                      placeholder="Сообщение..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary shrink-0 px-3" disabled={loading}>
                      →
                    </button>
                  </form>
                )}
                <button type="button" className="btn btn-secondary w-full text-sm" onClick={() => setView("home")}>
                  К меню
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
