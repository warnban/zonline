import Link from "next/link";
import type { SearchResult } from "@/lib/catalog/search";

export function SearchResultCard({ result }: { result: SearchResult }) {
  return (
    <Link
      href={result.href}
      className="card card-hover flex h-full flex-col p-5 sm:p-6"
    >
      <h3 className="text-lg font-semibold">{result.title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted">{result.description}</p>
      <span className="mt-4 text-sm font-medium text-accent">
        {result.kind === "landing" ? "Страница" : "Товар"} →
      </span>
    </Link>
  );
}
