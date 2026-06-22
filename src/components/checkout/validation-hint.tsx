"use client";

type Status = "idle" | "checking" | "valid" | "invalid" | "unknown";

type Props = {
  status: Status;
  message?: string | null;
};

export function ValidationHint({ status, message }: Props) {
  if (status === "idle") return null;

  if (status === "checking") {
    return <p className="mt-1.5 text-xs text-muted">Проверяем...</p>;
  }

  if (status === "valid") {
    return (
      <p className="mt-1.5 text-xs text-success">
        {message || "Данные подтверждены"}
      </p>
    );
  }

  if (status === "invalid") {
    return (
      <p className="mt-1.5 text-xs text-warning">
        {message || "Не удалось подтвердить данные"}
      </p>
    );
  }

  return (
    <p className="mt-1.5 text-xs text-muted">
      {message || "Проверка недоступна — можно продолжить оплату"}
    </p>
  );
}

export type ValidationStatus = Status;
