import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { getAdminSession } from "@/lib/admin/session";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Заказы" },
  { href: "/admin/support", label: "Поддержка" },
  { href: "/admin/catalog", label: "Каталог" },
  { href: "/admin/settings", label: "Настройки" },
  { href: "/admin/webhooks", label: "Webhooks" },
];

export async function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const session = await getAdminSession();

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold">
              Zynqo Admin
            </Link>
            <nav className="hidden gap-4 text-sm md:flex">
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="text-muted hover:text-accent">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {session && <span className="hidden text-muted sm:inline">{session.email}</span>}
            <AdminLogoutButton />
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-2 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs text-muted"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6">
          {title && <h1 className="mb-6 text-2xl font-semibold">{title}</h1>}
          {children}
        </div>
      </main>
    </div>
  );
}
