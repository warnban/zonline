import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderByPublicId } from "@/lib/orders/create";
import { formatRub } from "@/lib/pricing";
import { OrderDelivery } from "@/components/orders/order-delivery";

type Props = { params: Promise<{ id: string }> };

const statusLabels: Record<string, { label: string; desc: string }> = {
  PENDING_PAYMENT: { label: "Ожидает оплаты", desc: "Заказ создан, оплата не получена." },
  PAID: { label: "Оплачен", desc: "Платёж принят, заказ ставится в очередь." },
  PROCESSING: { label: "В обработке", desc: "Заказ выполняется у поставщика." },
  COMPLETED: { label: "Готово", desc: "Пополнение выполнено." },
  FAILED: { label: "Ошибка", desc: "Не удалось выполнить заказ. Напишите в поддержку." },
  REFUNDED: { label: "Возврат", desc: "Средства возвращены." },
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Заказ ${id}` };
}

export default async function OrderPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderByPublicId(id);
  if (!order) notFound();

  const status = statusLabels[order.status] ?? {
    label: order.status,
    desc: "",
  };

  const meta = order.metadata as { steamLogin?: string; walletAmountRub?: number } | null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="card p-6">
        <p className="text-sm text-muted">Заказ</p>
        <h1 className="text-xl font-semibold">{order.publicId}</h1>
        <p className="mt-1 text-sm text-muted">{order.email}</p>

        <div className="mt-6 rounded-md border border-border bg-surface-elevated p-4">
          <p className="font-medium">{status.label}</p>
          <p className="mt-1 text-sm text-muted">{status.desc}</p>
        </div>

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Сумма</dt>
            <dd>{formatRub(Number(order.amountRub))}</dd>
          </div>
          {meta?.steamLogin && (
            <div className="flex justify-between">
              <dt className="text-muted">Steam</dt>
              <dd>{meta.steamLogin}</dd>
            </div>
          )}
          {meta?.walletAmountRub != null && (
            <div className="flex justify-between">
              <dt className="text-muted">На кошелёк</dt>
              <dd>{formatRub(meta.walletAmountRub)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Создан</dt>
            <dd>{order.createdAt.toLocaleString("ru-RU")}</dd>
          </div>
        </dl>

        {order.errorMessage && (
          <p className="mt-4 text-sm text-warning">{order.errorMessage}</p>
        )}

        {order.status === "COMPLETED" && order.deliveryData && (
          <OrderDelivery deliveryData={order.deliveryData} />
        )}

        {order.status === "PENDING_PAYMENT" && order.payment && (
          <p className="mt-4 text-sm text-muted">
            Если вы закрыли окно оплаты, создайте заказ заново или напишите в поддержку с номером {order.publicId}.
          </p>
        )}
      </div>

      <div className="flex gap-3 text-sm">
        <Link href="/orders" className="text-accent hover:underline">
          Мои заказы
        </Link>
        <Link href="/" className="text-accent hover:underline">
          На главную
        </Link>
        <Link href="/about/contacts" className="text-accent hover:underline">
          Поддержка
        </Link>
      </div>
    </div>
  );
}
