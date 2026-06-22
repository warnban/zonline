import { extractDeliveryCodes } from "@/lib/orders/delivery-codes";

export function OrderDelivery({ deliveryData }: { deliveryData: unknown }) {
  const codes = extractDeliveryCodes(deliveryData);

  if (codes.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted">
        Пополнение выполнено. Код не требуется — проверьте аккаунт.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm font-medium">Коды / данные</p>
      {codes.map((code) => (
        <div
          key={code}
          className="rounded-md border border-border bg-surface-elevated px-3 py-2 font-mono text-sm break-all"
        >
          {code}
        </div>
      ))}
    </div>
  );
}
