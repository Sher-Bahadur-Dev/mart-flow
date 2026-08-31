import type { Metadata } from "next";

import { ProductList } from "@/components/catalog/product-list";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return <ProductList />;
}
