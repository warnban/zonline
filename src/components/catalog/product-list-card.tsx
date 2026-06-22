import Link from "next/link";
import type { CuratedProduct } from "@/lib/catalog/curated-products";

type Props = { product: CuratedProduct };

export function ProductListCard({ product }: Props) {
  const href = product.href ?? `/products/${product.slug}`;

  return (
    <Link
      href={href}
      className="card card-hover group flex h-full flex-col p-5 sm:p-6"
    >
      <h3 className="text-lg font-semibold group-hover:text-accent">{product.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{product.description}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
        {product.cta}
        <svg
          className="transition-transform group-hover:translate-x-0.5"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}
