import type { Metadata } from "next";
import { siteName, siteUrl } from "@/lib/legal/content";

type PageMeta = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildPageMetadata({
  title,
  description,
  path = "",
  keywords,
  noIndex,
}: PageMeta): Metadata {
  const url = `${siteUrl}${path}`;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url,
      siteName,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
