import { slugify } from "@/lib/pricing";
import { getCuratedCategoryIds } from "@/lib/catalog/curated-products";
import {
  getGiftCardCategories,
  getTopupCategories,
  type CatalogItem,
} from "@/lib/fazercards/catalog";
import { isFazerConfigured } from "@/lib/fazercards/client";
import { db } from "@/lib/db";

export type CatalogType = "gift_card" | "topup" | "game_key";

let syncInFlight: Promise<{ synced: number }> | null = null;

function makeCatalogSlug(name: string, categoryId: string): string {
  const base = slugify(name) || "item";
  const idPart = categoryId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return `${base}-${idPart}`;
}

async function fetchAllItems(
  fetcher: (cursor?: string) => Promise<{ items: CatalogItem[]; meta: { has_more: boolean; next_cursor: string | null } }>,
): Promise<CatalogItem[]> {
  const items: CatalogItem[] = [];
  let cursor: string | undefined;
  let hasMore = true;
  while (hasMore) {
    const page = await fetcher(cursor);
    items.push(...page.items);
    hasMore = page.meta.has_more && Boolean(page.meta.next_cursor);
    cursor = page.meta.next_cursor ?? undefined;
    if (!hasMore) break;
  }
  return items;
}

async function runSync(): Promise<{ synced: number }> {
  if (!isFazerConfigured()) {
    return { synced: 0 };
  }

  const curatedIds = new Set(getCuratedCategoryIds());

  const [giftCards, topups] = await Promise.all([
    fetchAllItems(getGiftCardCategories),
    fetchAllItems(getTopupCategories),
  ]);

  const batches: { type: CatalogType; items: CatalogItem[] }[] = [
    { type: "gift_card", items: giftCards },
    { type: "topup", items: topups },
  ];

  let synced = 0;
  for (const batch of batches) {
    for (let i = 0; i < batch.items.length; i++) {
      const item = batch.items[i];
      if (!item.category_id || !curatedIds.has(item.category_id)) continue;
      const slug = makeCatalogSlug(item.name, item.category_id);
      await db.catalogCategory.upsert({
        where: { id: item.category_id },
        create: {
          id: item.category_id,
          type: batch.type,
          name: item.name,
          slug,
          imageUrl: item.imageurl ?? null,
          sortOrder: i,
          rawData: item as object,
        },
        update: {
          name: item.name,
          slug,
          imageUrl: item.imageurl ?? null,
          sortOrder: i,
          syncedAt: new Date(),
          rawData: item as object,
        },
      });
      synced++;
    }
  }

  return { synced };
}

export function syncCatalogFromFazer(): Promise<{ synced: number }> {
  if (!syncInFlight) {
    syncInFlight = runSync().finally(() => {
      syncInFlight = null;
    });
  }
  return syncInFlight;
}

export async function getCatalogCategories(type?: CatalogType, search?: string) {
  if (type === "game_key") return [];

  const curatedIds = getCuratedCategoryIds();
  const where = {
    enabled: true,
    id: { in: curatedIds },
    ...(type ? { type } : {}),
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  let categories = await db.catalogCategory.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  if (categories.length === 0 && isFazerConfigured()) {
    await syncCatalogFromFazer();
    categories = await db.catalogCategory.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  return categories;
}

export async function getCategoryBySlug(slug: string, type?: CatalogType) {
  const decoded = decodeURIComponent(slug);
  return db.catalogCategory.findFirst({
    where: {
      slug: decoded,
      enabled: true,
      ...(type ? { type } : {}),
    },
  });
}

export async function getAllCatalogCategoriesAdmin(type?: CatalogType, search?: string) {
  return db.catalogCategory.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 200,
  });
}

export async function setCategoryEnabled(id: string, enabled: boolean) {
  return db.catalogCategory.update({
    where: { id },
    data: { enabled },
  });
}
