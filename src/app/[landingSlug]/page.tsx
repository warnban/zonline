import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getLandingByPath, landingPages, type LandingPage } from "@/lib/seo/landings";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SeoLandingProse } from "@/components/seo/seo-landing-prose";
import { SteamLandingView } from "@/components/pages/steam-landing-view";
import { TelegramStarsView } from "@/components/pages/telegram-stars-view";
import { TelegramPremiumView } from "@/components/pages/telegram-premium-view";
import { ProductsView } from "@/components/pages/products-view";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ landingSlug: string }> };

export async function generateStaticParams() {
  return landingPages.map((l) => ({
    landingSlug: l.path.replace(/^\//, ""),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { landingSlug } = await params;
  const landing = getLandingByPath(`/${landingSlug}`);
  if (!landing) return {};
  return buildPageMetadata({
    title: landing.title,
    description: landing.description,
    path: landing.path,
    keywords: landing.keywords,
  });
}

export default async function SeoLandingPage({ params }: Props) {
  const { landingSlug } = await params;
  const landing = getLandingByPath(`/${landingSlug}`);
  if (!landing) notFound();

  return <LandingContent landing={landing} />;
}

async function LandingContent({ landing }: { landing: LandingPage }) {
  if (landing.canonicalPath.startsWith("/products/")) {
    redirect(landing.canonicalPath);
  }

  let content: React.ReactNode;

  switch (landing.canonicalPath) {
    case "/steam":
      content = <SteamLandingView heading={landing.h1} />;
      break;
    case "/telegram/stars":
      content = <TelegramStarsView heading={landing.h1} />;
      break;
    case "/telegram/premium":
      content = <TelegramPremiumView heading={landing.h1} />;
      break;
    case "/products":
      content = <ProductsView />;
      break;
    default:
      notFound();
  }

  return (
    <>
      {content}
      <SeoLandingProse landing={landing} />
    </>
  );
}
