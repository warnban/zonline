import { env } from "@/lib/env";

const SUPPORT_INBOX = "support@zynqo.ru";

type SupportEmailPayload = {
  ticketId: string;
  email: string;
  subject: string;
  body: string;
  isReply?: boolean;
};

async function sendEmail(to: string, subject: string, html: string) {
  if (env.RESEND_API_KEY && env.EMAIL_FROM) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend error", await res.text());
    }
    return;
  }

  console.log("[email:dev]", to, subject);
}

export async function sendSupportNotificationEmail(payload: SupportEmailPayload) {
  const ticketUrl = `${env.APP_URL}/support?ticket=${payload.ticketId}`;
  const subject = `[Zynqo] Новое обращение: ${payload.subject}`;
  const html = `
    <p>Новое сообщение в поддержке</p>
    <p><strong>Email:</strong> ${payload.email}</p>
    <p><strong>Тикет:</strong> ${payload.ticketId}</p>
    <p><strong>Тема:</strong> ${payload.subject}</p>
    <blockquote>${payload.body.replace(/\n/g, "<br>")}</blockquote>
    <p><a href="${ticketUrl}">Открыть в виджете</a></p>
  `;
  await sendEmail(SUPPORT_INBOX, subject, html);
}

export async function sendSupportReplyToUserEmail(payload: SupportEmailPayload) {
  const ticketUrl = `${env.APP_URL}/support?ticket=${payload.ticketId}`;
  const subject = `Zynqo — ответ поддержки: ${payload.subject}`;
  const html = `
    <p>Ответ по вашему обращению:</p>
    <blockquote>${payload.body.replace(/\n/g, "<br>")}</blockquote>
    <p><a href="${ticketUrl}">Продолжить диалог</a></p>
  `;
  await sendEmail(payload.email, subject, html);
}
