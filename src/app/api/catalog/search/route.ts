import { NextResponse } from "next/server";
import { getCatalogCategories } from "@/lib/catalog/sync";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type") as "gift_card" | "topup" | "game_key" | null;

  if (!q || q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const items = await getCatalogCategories(type ?? undefined, q);
  return NextResponse.json({
    items: items.slice(0, 20).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      type: c.type,
      href:
        c.type === "gift_card"
          ? `/gift-cards/${c.slug}`
          : c.type === "topup"
            ? `/games/${c.slug}`
            : `/keys/${c.slug}`,
    })),
  });
}
