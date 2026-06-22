import type { Metadata } from "next";
import { ProductsView } from "@/components/pages/products-view";

export const metadata: Metadata = {
  title: "Все продукты",
  description: "PUBG, Free Fire, Roblox, Steam, Telegram и подарочные карты.",
};

export default function ProductsPage() {
  return <ProductsView />;
}
