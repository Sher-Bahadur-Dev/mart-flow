import type { Metadata } from "next";

import { ProductDetail } from "@/components/catalog/product-detail";

export const metadata: Metadata = { title: "Product" };

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetail id={id} />;
}
