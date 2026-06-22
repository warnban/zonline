import { CategoryCard } from "@/components/catalog/category-card";
import { TrustStrip } from "@/components/trust/trust-strip";
import { getCatalogCategories, type CatalogType } from "@/lib/catalog/sync";

type Props = {
  type: CatalogType;
  heading: string;
  basePath: string;
  description?: string;
};

export async function CatalogListView({ type, heading, basePath, description }: Props) {
  const categories = await getCatalogCategories(type);

  return (
    <div className="space-y-6">
      <TrustStrip />
      <div>
        <h1 className="text-2xl font-semibold">{heading}</h1>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      </div>
      {categories.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          Каталог загружается. Обновите страницу через минуту.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              href={`${basePath}/${cat.slug}`}
              name={cat.name}
              imageUrl={cat.imageUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
