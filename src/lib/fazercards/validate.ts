import { fazerRequest } from "@/lib/fazercards/client";

export type ValidationResult = {
  valid: boolean | null;
  message?: string;
  skipped?: boolean;
};

function parsePayload(data: Record<string, unknown>): ValidationResult {
  if (data.skipped) {
    return { valid: null, skipped: true, message: String(data.message ?? "") };
  }

  if (data.valid === false || data.can_refill === false) {
    return {
      valid: false,
      message: String(data.message ?? data.error ?? "Данные не прошли проверку"),
    };
  }

  if (data.valid === true || data.can_refill === true) {
    return {
      valid: true,
      message: String(data.message ?? ""),
    };
  }

  if (data.ok === true) {
    return { valid: true };
  }

  if (data.ok === false) {
    return {
      valid: false,
      message: String(data.message ?? data.error ?? "Проверка не пройдена"),
    };
  }

  return { valid: null };
}

export async function validateTopupId(
  categoryId: string,
  offerId: string,
  fields: Record<string, string>,
): Promise<ValidationResult> {
  try {
    const data = await fazerRequest<Record<string, unknown>>("POST", "/topups/validate-id", {
      body: { category_id: categoryId, offer_id: offerId, fields },
    });
    return parsePayload(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "validate failed";
    if (message.includes("404") || message.toLowerCase().includes("not found")) {
      return { valid: null, skipped: true, message: "Проверка недоступна для этого товара" };
    }
    return { valid: null, message: "Не удалось выполнить проверку" };
  }
}

export async function validateTelegramUsername(username: string): Promise<ValidationResult> {
  const normalized = username.replace(/^@/, "").trim();
  if (!/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(normalized)) {
    return { valid: false, message: "Некорректный формат username" };
  }

  try {
    const data = await fazerRequest<Record<string, unknown>>("POST", "/telegram/validate-id", {
      body: { telegram_username: normalized },
    });
    return parsePayload(data);
  } catch {
    try {
      const data = await fazerRequest<Record<string, unknown>>("POST", "/telegram/stars/validate-id", {
        body: { telegram_username: normalized },
      });
      return parsePayload(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "validate failed";
      if (message.includes("404") || message.toLowerCase().includes("not found")) {
        return { valid: null, skipped: true, message: "Проверка через API недоступна — проверьте @username" };
      }
      return { valid: null, skipped: true, message: "Проверка через API недоступна" };
    }
  }
}
