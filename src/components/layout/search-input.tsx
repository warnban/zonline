"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
};

export function SearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Игра, карта, сервис…",
  className = "",
}: Props) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border border-border bg-surface-elevated px-3 py-2 ${className}`}
    >
      <svg
        className="shrink-0 text-muted"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        role="searchbox"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted"
        autoComplete="off"
      />
    </div>
  );
}

export function SearchForm({
  defaultQuery = "",
  className = "",
}: {
  defaultQuery?: string;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);

  function submit() {
    const q = query.trim();
    if (q.length >= 2) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex gap-2">
        <SearchInput value={query} onChange={setQuery} onSubmit={submit} className="flex-1" />
        <button type="submit" className="btn btn-primary shrink-0 px-4">
          Найти
        </button>
      </div>
    </form>
  );
}
