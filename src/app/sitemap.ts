import type { MetadataRoute } from "next";
import { curatedProducts } from "@/lib/catalog/curated-products";
import { landingPages } from "@/lib/seo/landings";

const staticRoutes = [
  { path: "/", priority: 1.0 },
  { path: "/products", priority: 0.95 },
  { path: "/steam", priority: 0.95 },
  { path: "/telegram", priority: 0.9 },
  { path: "/telegram/stars", priority: 0.9 },
  { path: "/telegram/premium", priority: 0.9 },
  { path: "/about", priority: 0.5 },
  { path: "/about/payments", priority: 0.4 },
  { path: "/about/privacy", priority: 0.3 },
  { path: "/about/terms", priority: 0.3 },
  { path: "/about/contacts", priority: 0.4 },
  { path: "/support", priority: 0.5 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "https://zynqo.ru";

  return [
    ...staticRoutes.map(({ path, priority }) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority,
    })),
    ...curatedProducts.map((p) => ({
      url: `${base}${p.href ?? `/products/${p.slug}`}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
    ...landingPages.map((l) => ({
      url: `${base}${l.path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
