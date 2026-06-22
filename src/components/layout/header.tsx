import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const nav = [
  { href: "/steam", label: "Steam" },
  { href: "/telegram/stars", label: "TG Stars" },
  { href: "/telegram/premium", label: "TG Premium" },
  { href: "/gift-cards", label: "Карты" },
  { href: "/games", label: "Игры" },
  { href: "/keys", label: "Ключи" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight">
          Zynqo
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted hover:bg-surface hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/orders"
            className="hidden rounded-md px-3 py-1.5 text-sm text-muted hover:text-foreground sm:inline"
          >
            Мои заказы
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
