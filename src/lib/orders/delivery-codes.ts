/** Извлекает коды/ключи из ответа FazerCards (order.completed / deliveryData). */
export function extractDeliveryCodes(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;
  const codes: string[] = [];

  if (typeof o.code === "string") codes.push(o.code);

  if (Array.isArray(o.codes)) {
    for (const c of o.codes) {
      if (typeof c === "string") codes.push(c);
      else if (c && typeof c === "object" && "code" in c) {
        codes.push(String((c as { code: string }).code));
      }
    }
  }

  if (Array.isArray(o.cards)) {
    for (const c of o.cards) {
      if (typeof c === "string") codes.push(c);
      else if (c && typeof c === "object") {
        const card = c as Record<string, unknown>;
        if (typeof card.code === "string") codes.push(card.code);
      }
    }
  }

  return codes;
}

export function formatDeliveryCodesHtml(codes: string[]): string {
  if (codes.length === 0) return "";
  const items = codes
    .map(
      (code) =>
        `<li style="margin:8px 0;padding:10px 12px;background:#f4f4f5;border-radius:8px;font-family:monospace;word-break:break-all;">${escapeHtml(code)}</li>`,
    )
    .join("");
  return `
    <p><strong>Ваши коды:</strong></p>
    <ul style="list-style:none;padding:0;margin:12px 0;">${items}</ul>
    <p style="font-size:13px;color:#71717a;">Сохраните коды — они также доступны на странице заказа.</p>
  `;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
