import Link from "next/link";
import { SearchResultCard } from "@/components/catalog/search-result-card";
import { SearchForm } from "@/components/layout/search-input";
import { searchCatalog } from "@/lib/catalog/search";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  return buildPageMetadata({
    title: q ? `Поиск: ${q}` : "Поиск по каталогу",
    description: "Найдите Steam, Telegram, игры и подарочные карты на Zynqo.",
    path: q ? `/search?q=${encodeURIComponent(q)}` : "/search",
    noIndex: Boolean(q),
  });
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const results = query.length >= 2 ? searchCatalog(query) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Поиск по каталогу</h1>
        {query && (
          <p className="mt-2 text-sm text-muted">
            «{query}» — {results.length}{" "}
            {results.length === 1 ? "результат" : "результатов"}
          </p>
        )}
      </div>

      <SearchForm defaultQuery={query} className="max-w-lg" />

      {!query && (
        <p className="text-sm text-muted">
          Введите запрос: steam, стим, pubg, telegram, roblox…
        </p>
      )}
      {query && results.length === 0 && (
        <p className="text-sm text-muted">Ничего не найдено. Попробуйте другое слово.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((result) => (
          <SearchResultCard key={result.href} result={result} />
        ))}
      </div>

      {query && results.length === 0 && (
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/steam" className="text-accent hover:underline">
            Steam
          </Link>
          <Link href="/telegram" className="text-accent hover:underline">
            Telegram
          </Link>
          <Link href="/products" className="text-accent hover:underline">
            Все продукты
          </Link>
        </div>
      )}
    </div>
  );
}
