import type { Metadata } from "next";

import { SupplierDetail } from "@/components/suppliers/supplier-detail";

export const metadata: Metadata = { title: "Supplier" };

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SupplierDetail id={id} />;
}
