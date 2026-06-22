"use client";

import { useState } from "react";
import { ValidationHint, type ValidationStatus } from "@/components/checkout/validation-hint";

type Props = {
  username: string;
  onUsernameChange: (value: string) => void;
  label?: string;
};

export function TelegramUsernameField({
  username,
  onUsernameChange,
  label = "Telegram username",
}: Props) {
  const [checking, setChecking] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("idle");
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  async function validateUsername() {
    if (!username.trim()) return;
    setChecking(true);
    setValidationStatus("checking");
    setValidationMessage(null);
    try {
      const res = await fetch("/api/telegram/validate-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      const data = await res.json();
      if (data.valid === true) {
        setValidationStatus("valid");
        setValidationMessage(data.message || "Username подтверждён");
      } else if (data.valid === false) {
        setValidationStatus("invalid");
        setValidationMessage(data.message || "Username не найден");
      } else {
        setValidationStatus("unknown");
        setValidationMessage(data.message || "Проверка недоступна");
      }
    } catch {
      setValidationStatus("unknown");
      setValidationMessage("Проверка недоступна — можно продолжить оплату");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <input
          className="input"
          value={username}
          onChange={(e) => {
            onUsernameChange(e.target.value);
            setValidationStatus("idle");
          }}
          placeholder="@username"
        />
        <button
          type="button"
          className="btn btn-secondary shrink-0"
          disabled={checking || !username.trim()}
          onClick={validateUsername}
        >
          {checking ? "..." : "Проверить"}
        </button>
      </div>
      <ValidationHint status={validationStatus} message={validationMessage} />
    </div>
  );
}
