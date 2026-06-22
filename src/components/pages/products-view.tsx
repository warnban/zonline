import { ProductListCard } from "@/components/catalog/product-list-card";
import { TrustStrip } from "@/components/trust/trust-strip";
import { productSections, getProductsBySection } from "@/lib/catalog/curated-products";

export function ProductsView() {
  return (
    <div className="space-y-10">
      <TrustStrip />
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">Все продукты</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Пополните любую игровую валюту, купите подарочную карту или пополните Steam и Telegram.
        </p>
      </div>

      {productSections.map((section) => {
        const products = getProductsBySection(section.id);
        return (
          <section key={section.id} className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-1 max-w-3xl text-sm text-muted">{section.intro}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductListCard key={product.slug} product={product} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
