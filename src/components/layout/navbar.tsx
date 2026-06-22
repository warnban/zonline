"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ZynqoLogo } from "@/components/brand/zynqo-logo";
import { MobileMenu } from "./mobile-menu";
import { SearchInput } from "./search-input";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/products", label: "Продукты" },
  { href: "/steam", label: "Steam" },
  { href: "/telegram", label: "Telegram" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  function runSearch() {
    const q = query.trim();
    if (q.length >= 2) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center gap-3 sm:gap-4">
            <ZynqoLogo />

            <nav className="hidden items-center gap-0.5 lg:flex">
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-accent-soft font-medium text-accent"
                        : "text-muted hover:bg-surface-elevated hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <form
              className="ml-auto flex min-w-0 max-w-[200px] flex-1 sm:max-w-xs lg:max-w-sm"
              onSubmit={(e) => {
                e.preventDefault();
                runSearch();
              }}
            >
              <SearchInput value={query} onChange={setQuery} onSubmit={runSearch} />
            </form>

            <div className="flex shrink-0 items-center gap-1.5">
              <Link
                href="/orders"
                className="btn btn-secondary hidden px-3 py-2 text-sm sm:inline-flex"
              >
                Заказы
              </Link>
              <ThemeToggle />
              <button
                type="button"
                className="btn btn-secondary px-2.5 py-2 lg:hidden"
                onClick={() => setMenuOpen(true)}
                aria-label="Открыть меню"
                aria-expanded={menuOpen}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSearch={runSearch}
        searchQuery={query}
        onSearchQueryChange={setQuery}
      />
    </>
  );
}
