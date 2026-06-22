import Link from "next/link";
import { supportEmail } from "@/lib/legal/content";

export const metadata = { title: "Контакты" };

export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">Контакты</h1>
      <p className="text-muted">
        Ответим на вопросы по заказам, оплате и статусу пополнения.
      </p>
      <div className="card space-y-4 p-5">
        <div>
          <p className="text-sm font-medium">Email</p>
          <a href={`mailto:${supportEmail}`} className="text-accent hover:underline">
            {supportEmail}
          </a>
        </div>
        <div>
          <p className="text-sm font-medium">Чат на сайте</p>
          <p className="text-sm text-muted">Кнопка в правом нижнем углу (скоро)</p>
        </div>
        <div>
          <p className="text-sm font-medium">Время ответа</p>
          <p className="text-sm text-muted">Обычно в течение нескольких часов</p>
        </div>
      </div>
      <Link href="/about" className="text-sm text-accent hover:underline">
        ← О сервисе
      </Link>
    </div>
  );
}
