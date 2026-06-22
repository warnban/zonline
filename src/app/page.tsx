import Link from "next/link";
import { ProductListCard } from "@/components/catalog/product-list-card";
import { ServiceTile } from "@/components/catalog/service-tile";
import { TrustStrip } from "@/components/trust/trust-strip";
import { curatedProducts } from "@/lib/catalog/curated-products";

export const dynamic = "force-dynamic";

const quickLinks = curatedProducts.filter((p) => p.section === "games" || p.section === "services").slice(0, 4);

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.18),transparent_55%)]" />
        <div className="relative grid lg:grid-cols-[1.2fr_1fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Steam, Telegram, игры и карты
            </h1>
            <p className="mt-4 max-w-lg text-muted">
              Укажите данные, оплатите, получите результат на почту. Без регистрации.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/steam" className="btn btn-primary">
                Пополнить Steam
              </Link>
              <Link href="/products" className="btn btn-secondary">
                Все продукты
              </Link>
            </div>
          </div>
          <div className="border-t border-border p-6 lg:border-l lg:border-t-0 lg:p-8">
            <TrustStrip />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-lg font-semibold">Популярное</h2>
          <Link href="/products" className="text-sm text-accent hover:underline">
            Весь каталог
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((product) => (
            <ProductListCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Сервисы</h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <ServiceTile href="/steam" id="steam" title="Steam" desc="Пополнение по логину" />
          <ServiceTile href="/telegram" id="telegram-stars" title="Telegram" desc="Stars & Premium" />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-medium">Как это работает</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {["Выберите товар", "Укажите email и оплатите", "Получите результат"].map(
            (step, i) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold text-accent">
                  {i + 1}
                </span>
                <span className="text-muted">{step}</span>
              </li>
            ),
          )}
        </ol>
      </section>
    </div>
  );
}
