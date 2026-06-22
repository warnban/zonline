import { getAllCatalogCategoriesAdmin } from "@/lib/catalog/sync";
import { CatalogAdminTable } from "@/components/admin/catalog-admin-table";

export const metadata = { title: "Каталог · Admin", robots: { index: false } };

export default async function AdminCatalogPage() {
  const items = await getAllCatalogCategoriesAdmin();

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Каталог</h1>
      <CatalogAdminTable
        items={items.map((i) => ({
          id: i.id,
          name: i.name,
          type: i.type,
          enabled: i.enabled,
        }))}
      />
    </>
  );
}
