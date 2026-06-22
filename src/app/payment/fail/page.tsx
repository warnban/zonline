import Link from "next/link";

type Props = {
  searchParams: Promise<{
    MERCHANT_ORDER_ID?: string;
    merchant_order_id?: string;
  }>;
};

export const metadata = {
  title: "Оплата не прошла",
  robots: { index: false, follow: false },
};

export default async function PaymentFailPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderId =
    params.MERCHANT_ORDER_ID ?? params.merchant_order_id ?? null;

  return (
    <div className="mx-auto max-w-lg">
      <div className="card p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-elevated text-warning">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold">Оплата не завершена</h1>
        <p className="mt-2 text-sm text-muted">
          Платёж отменён или не прошёл. Деньги не списаны — можно попробовать снова.
        </p>
        {orderId && (
          <p className="mt-4 text-sm text-muted">
            Заказ: {orderId}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/" className="btn btn-primary">
            Вернуться к покупке
          </Link>
          <Link href="/about/contacts" className="btn btn-secondary">
            Поддержка
          </Link>
        </div>
      </div>
    </div>
  );
}
