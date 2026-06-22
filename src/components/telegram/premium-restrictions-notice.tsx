import Link from "next/link";

export function PremiumRestrictionsNotice() {
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
      <p className="font-medium text-warning">⚠️ Ограничения (только для Premium)</p>
      <p className="mt-2 leading-relaxed text-muted">
        Ограничения применяются только при покупке подписки Telegram Premium: если на указанном
        @username уже активен Premium, повторная покупка невозможна и может привести к проблемам.
        Если оплатили по ошибке — обратитесь в{" "}
        <Link href="/support" className="text-accent hover:underline">
          поддержку
        </Link>
        . Для пополнения звёзд (Telegram Stars) ограничений нет.
      </p>
      <p className="mt-2 leading-relaxed text-muted">
        <strong className="font-medium text-foreground">Важно:</strong> при ошибке в @username
        средства могут быть утеряны.
      </p>
    </div>
  );
}
