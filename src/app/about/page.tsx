import Link from "next/link";
import { legalIntro, supportEmail } from "@/lib/legal/content";

export const metadata = { title: "О сервисе" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">О сервисе {legalIntro.serviceName}</h1>
        <p className="mt-4 text-muted leading-relaxed">
          {legalIntro.serviceName} — сервис для покупки цифровых товаров из России:
          пополнение Steam, Telegram Premium и Stars, подарочные карты, донат в игры и ключи.
          Оформление без регистрации — достаточно email для получения статуса заказа.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { title: "Быстро", text: "Большинство заказов выполняется автоматически за несколько минут." },
          { title: "Понятно", text: "Цена и комиссия видны до оплаты. Без скрытых шагов." },
          { title: "Из РФ", text: "Оплата картой и СБП через платёжного партнёра." },
          { title: "Поддержка", text: "Чат на сайте и email для вопросов по заказам." },
        ].map((item) => (
          <div key={item.title} className="card p-4">
            <h2 className="font-medium">{item.title}</h2>
            <p className="mt-2 text-sm text-muted">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <h2 className="font-medium">Документы</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link href="/about/privacy" className="text-accent hover:underline">
              Политика конфиденциальности
            </Link>
          </li>
          <li>
            <Link href="/about/terms" className="text-accent hover:underline">
              Пользовательское соглашение
            </Link>
          </li>
          <li>
            <Link href="/about/payments" className="text-accent hover:underline">
              Способы оплаты
            </Link>
          </li>
          <li>
            <Link href="/about/contacts" className="text-accent hover:underline">
              Контакты
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
