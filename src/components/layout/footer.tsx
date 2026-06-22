"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.png" alt="Zynqo" width={28} height={28} className="rounded-md" />
            <span className="font-semibold">Zynqo</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Цифровые товары и пополнения. Steam, Telegram, игры и карты.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Каталог</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/steam" className="hover:text-accent">
                Steam
              </Link>
            </li>
            <li>
              <Link href="/telegram/stars" className="hover:text-accent">
                Telegram Stars
              </Link>
            </li>
            <li>
              <Link href="/gift-cards" className="hover:text-accent">
                Подарочные карты
              </Link>
            </li>
            <li>
              <Link href="/games" className="hover:text-accent">
                Игры
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium">Сервис</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/orders" className="hover:text-accent">
                Мои заказы
              </Link>
            </li>
            <li>
              <Link href="/support" className="hover:text-accent">
                Поддержка
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium">Документы</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/about" className="hover:text-accent">
                О сервисе
              </Link>
            </li>
            <li>
              <Link href="/about/privacy" className="hover:text-accent">
                Конфиденциальность
              </Link>
            </li>
            <li>
              <Link href="/about/terms" className="hover:text-accent">
                Соглашение
              </Link>
            </li>
            <li>
              <Link href="/about/contacts" className="hover:text-accent">
                Контакты
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Zynqo ·{" "}
        <a href="mailto:support@zynqo.ru" className="hover:text-accent">
          support@zynqo.ru
        </a>
      </div>
    </footer>
  );
}
