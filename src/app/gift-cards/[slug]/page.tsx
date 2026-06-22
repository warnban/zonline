import { redirect } from "next/navigation";
import { getCategoryBySlug } from "@/lib/catalog/sync";
import { curatedProducts } from "@/lib/catalog/curated-products";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export default async function LegacyGiftCardRedirect({ params }: Props) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug, "gift_card");
  const match = cat
    ? curatedProducts.find((p) => p.categoryId === cat.id && p.catalogType === "gift_card")
    : undefined;
  redirect(match ? `/products/${match.slug}` : "/products");
}
