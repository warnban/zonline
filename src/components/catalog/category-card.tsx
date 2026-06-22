import Link from "next/link";
import Image from "next/image";

type Props = {
  href: string;
  name: string;
  imageUrl?: string | null;
  badge?: string;
  priceFrom?: string;
};

export function CategoryCard({ href, name, imageUrl, badge, priceFrom }: Props) {
  return (
    <Link href={href} className="card card-hover group flex flex-col overflow-hidden">
      <div className="relative flex h-28 items-center justify-center bg-surface-elevated p-4">
        {imageUrl ? (
          <Image
            src={imageUrl.startsWith("http") ? imageUrl : `https://api.fzr.cards${imageUrl}`}
            alt=""
            width={80}
            height={80}
            className="max-h-16 w-auto object-contain"
            unoptimized
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-md bg-accent-soft text-xl font-semibold text-accent">
            {name.charAt(0)}
          </span>
        )}
        {badge && (
          <span className="absolute right-2 top-2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-border p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-accent">
          {name}
        </h3>
        {priceFrom && (
          <p className="mt-auto text-xs text-muted">от {priceFrom}</p>
        )}
      </div>
    </Link>
  );
}
