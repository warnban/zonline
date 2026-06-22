"use client";

import Link from "next/link";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { SearchInput } from "./search-input";
import { ServiceIconBadge } from "@/components/icons/service-icons";
import type { ServiceId } from "@/components/icons/service-icons";

const catalogItems: { href: string; label: string; icon: ServiceId }[] = [
  { href: "/products", label: "Все продукты", icon: "games" },
  { href: "/steam", label: "Steam", icon: "steam" },
  { href: "/telegram", label: "Telegram", icon: "telegram-stars" },
];

const utilityItems = [
  { href: "/orders", label: "Мои заказы" },
  { href: "/support", label: "Поддержка" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
};

export function MobileMenu({
  open,
  onClose,
  onSearch,
  searchQuery,
  onSearchQueryChange,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Закрыть меню"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-[min(100%,320px)] flex-col border-l border-border bg-surface shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-medium">Меню</span>
          <button type="button" className="btn btn-secondary px-2.5 py-2" onClick={onClose} aria-label="Закрыть">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <form
            className="mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
              onClose();
            }}
          >
            <SearchInput value={searchQuery} onChange={onSearchQueryChange} onSubmit={onSearch} />
          </form>
          <nav className="flex flex-col gap-1">
            {catalogItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-surface-elevated"
              >
                <ServiceIconBadge id={item.icon} />
                {item.label}
              </Link>
            ))}
            <div className="my-2 border-t border-border" />
            {utilityItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-elevated hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>,
    document.body,
  );
}
