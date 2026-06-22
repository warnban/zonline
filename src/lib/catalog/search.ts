import { curatedProducts, type CuratedProduct } from "./curated-products";
import { landingPages, type LandingPage } from "@/lib/seo/landings";

export type SearchResult = {
  title: string;
  description: string;
  href: string;
  kind: "product" | "landing";
};

/** Транслит и частые опечатки → латиница для сопоставления */
function normalizeQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ");
}

const cyrToLat: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch",
  ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function transliterate(text: string): string {
  return text
    .split("")
    .map((c) => cyrToLat[c] ?? c)
    .join("");
}

function productHref(p: CuratedProduct): string {
  return p.href ?? `/products/${p.slug}`;
}

function productHaystack(p: CuratedProduct): string {
  const kw = p.keywords ?? [];
  return normalizeQuery([p.title, p.description, p.slug, ...kw].join(" "));
}

function landingHaystack(l: LandingPage): string {
  return normalizeQuery([l.title, l.description, l.h1, l.path, ...l.keywords].join(" "));
}

function matchesHaystack(haystack: string, q: string, qLat: string): boolean {
  if (haystack.includes(q) || haystack.includes(qLat)) return true;
  // отдельные слова запроса
  const tokens = q.split(" ").filter((t) => t.length >= 2);
  return tokens.length > 0 && tokens.every((t) => haystack.includes(t) || haystack.includes(transliterate(t)));
}

export function searchCatalog(rawQuery: string): SearchResult[] {
  const q = normalizeQuery(rawQuery);
  if (q.length < 2) return [];

  const qLat = transliterate(q);
  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const p of curatedProducts) {
    if (!matchesHaystack(productHaystack(p), q, qLat)) continue;
    const href = productHref(p);
    if (seen.has(href)) continue;
    seen.add(href);
    results.push({
      title: p.title,
      description: p.description,
      href,
      kind: "product",
    });
  }

  for (const l of landingPages) {
    if (!matchesHaystack(landingHaystack(l), q, qLat)) continue;
    if (seen.has(l.path)) continue;
    seen.add(l.path);
    results.push({
      title: l.h1,
      description: l.description,
      href: l.path,
      kind: "landing",
    });
  }

  return results;
}

/** @deprecated use searchCatalog */
export function searchCuratedProducts(query: string): CuratedProduct[] {
  const hrefs = new Set(searchCatalog(query).filter((r) => r.kind === "product").map((r) => r.href));
  return curatedProducts.filter((p) => hrefs.has(productHref(p)));
}
