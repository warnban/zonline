import Link from "next/link";

type Props = {
  searchParams: Promise<{
    MERCHANT_ORDER_ID?: string;
    merchant_order_id?: string;
  }>;
};

export const metadata = {
  title: "Оплата прошла",
  robots: { index: false, follow: false },
};

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderId =
    params.MERCHANT_ORDER_ID ?? params.merchant_order_id ?? null;

  return (
    <div className="mx-auto max-w-lg">
      <div className="card p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold">Оплата принята</h1>
        <p className="mt-2 text-sm text-muted">
          Платёж получен. Заказ обрабатывается — результат придёт на email и появится в статусе заказа.
        </p>
        {orderId && (
          <p className="mt-4 text-sm">
            Номер заказа: <span className="font-medium">{orderId}</span>
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {orderId ? (
            <Link href={`/order/${orderId}`} className="btn btn-primary">
              Статус заказа
            </Link>
          ) : (
            <Link href="/orders" className="btn btn-primary">
              Мои заказы
            </Link>
          )}
          <Link href="/" className="btn btn-secondary">
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
