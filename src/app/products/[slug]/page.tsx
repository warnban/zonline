import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCuratedProduct } from "@/lib/catalog/curated-products";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getTopupOffers, getGiftCardOffers } from "@/lib/fazercards/catalog";
import { getPricingSettings } from "@/lib/settings";
import { calculateRetailRub } from "@/lib/pricing";
import { GameTopupCheckout } from "@/components/topup/game-topup-checkout";
import { GiftCardCheckout } from "@/components/catalog/gift-card-checkout";
import { ServiceIconBadge } from "@/components/icons/service-icons";
import type { ServiceId } from "@/components/icons/service-icons";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const iconBySlug: Partial<Record<string, ServiceId>> = {
  "pubg-mobile": "games",
  "free-fire": "games",
  roblox: "gift-cards",
  "pubg-codes": "gift-cards",
  "free-fire-codes": "gift-cards",
  itunes: "gift-cards",
  playstation: "gift-cards",
  valorant: "gift-cards",
  fortnite: "games",
  "steam-codes": "steam",
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const product = getCuratedProduct(slug);
  if (!product) return {};
  return buildPageMetadata({
    title: product.title,
    description: product.description,
    path: `/products/${slug}`,
    keywords: product.keywords,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getCuratedProduct(slug);
  if (!product) notFound();

  if (product.href) redirect(product.href);

  const categoryId = product.categoryId!;
  const [settings, offersData] = await Promise.all([
    getPricingSettings(),
    product.catalogType === "topup"
      ? getTopupOffers(categoryId).catch(() => ({ ok: false, items: [], fields: [] }))
      : getGiftCardOffers(categoryId).catch(() => ({ ok: false, items: [] })),
  ]);

  const icon = iconBySlug[slug] ?? (product.catalogType === "topup" ? "games" : "gift-cards");

  if (product.catalogType === "topup") {
    const topupData = offersData as Awaited<ReturnType<typeof getTopupOffers>>;
    const offerOptions = (topupData.items ?? [])
      .map((offer) => {
        const usd = parseFloat(String(offer.price_usd ?? "0"));
        const priceRub = usd > 0 ? calculateRetailRub(usd, settings) : 0;
        if (priceRub <= 0) return null;
        return {
          offerId: String(offer.offer_id),
          name: String(offer.name ?? offer.offer_id),
          priceRub,
        };
      })
      .filter(Boolean) as { offerId: string; name: string; priceRub: number }[];

    const fieldsDef = topupData.fields ?? topupData.items?.[0]?.fields ?? [];

    return (
      <div className="space-y-6">
        <div>
          <Link href="/products" className="text-sm text-muted hover:text-accent">
            ← Все продукты
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <ServiceIconBadge id={icon} />
            <div>
              <h1 className="text-2xl font-semibold">{product.title}</h1>
              <p className="text-sm text-muted">{product.description}</p>
            </div>
          </div>
        </div>

        {offerOptions.length > 0 ? (
          <GameTopupCheckout
            categoryId={categoryId}
            categoryName={product.title}
            offers={offerOptions}
            fieldsDef={fieldsDef}
            rawOffers={topupData.items ?? []}
          />
        ) : (
          <div className="card p-8 text-center text-sm text-muted">
            Номиналы временно недоступны. Попробуйте позже или напишите в{" "}
            <Link href="/support" className="text-accent hover:underline">
              поддержку
            </Link>
            .
          </div>
        )}
      </div>
    );
  }

  const giftOptions = (offersData.items ?? [])
    .map((offer) => {
      const usd = parseFloat(String(offer.price_usd ?? "0"));
      const priceRub = usd > 0 ? calculateRetailRub(usd, settings) : 0;
      if (priceRub <= 0) return null;
      return {
        cardId: String(offer.card_id),
        name: String(offer.name ?? offer.card_id),
        priceRub,
      };
    })
    .filter(Boolean) as { cardId: string; name: string; priceRub: number }[];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/products" className="text-sm text-muted hover:text-accent">
          ← Все продукты
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <ServiceIconBadge id={icon} />
          <div>
            <h1 className="text-2xl font-semibold">{product.title}</h1>
            <p className="text-sm text-muted">{product.description}</p>
          </div>
        </div>
      </div>

      {giftOptions.length > 0 ? (
        <GiftCardCheckout
          categoryId={categoryId}
          productTitle={product.title}
          offers={giftOptions}
        />
      ) : (
        <div className="card p-8 text-center text-sm text-muted">
          Номиналы временно недоступны. Попробуйте позже или напишите в{" "}
          <Link href="/support" className="text-accent hover:underline">
            поддержку
          </Link>
          .
        </div>
      )}
    </div>
  );
}
