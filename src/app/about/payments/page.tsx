import Link from "next/link";
import { supportEmail } from "@/lib/legal/content";

export const metadata = {
  title: "Способы оплаты",
  description: "Как оплатить заказ на Zynqo — карта, СБП и другие способы.",
};

export default function PaymentsInfoPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Способы оплаты</h1>
        <p className="mt-2 text-muted leading-relaxed">
          Оплата проходит на защищённой странице платёжного партнёра. Мы не храним данные вашей
          банковской карты.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            title: "Банковская карта",
            text: "Visa, Mastercard, МИР — оплата в рублях.",
          },
          {
            title: "СБП",
            text: "Быстрая оплата через приложение банка по QR или ссылке.",
          },
          {
            title: "Чек на email",
            text: "Укажите email при оформлении — туда придёт подтверждение и результат заказа.",
          },
          {
            title: "Без регистрации",
            text: "Аккаунт на сайте не нужен. Достаточно email для отслеживания заказа.",
          },
        ].map((item) => (
          <div key={item.title} className="card p-4">
            <h2 className="font-medium">{item.title}</h2>
            <p className="mt-2 text-sm text-muted">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="card p-5 text-sm text-muted">
        <p className="font-medium text-foreground">Если оплата не прошла</p>
        <p className="mt-2 leading-relaxed">
          Проверьте лимиты карты или попробуйте другой способ. Если деньги списались, а заказ не
          обновился — напишите в{" "}
          <a href={`mailto:${supportEmail}`} className="text-accent hover:underline">
            {supportEmail}
          </a>{" "}
          с номером заказа из письма или раздела{" "}
          <Link href="/orders" className="text-accent hover:underline">
            «Мои заказы»
          </Link>
          .
        </p>
      </div>

      <Link href="/about" className="text-sm text-accent hover:underline">
        ← О сервисе
      </Link>
    </div>
  );
}
