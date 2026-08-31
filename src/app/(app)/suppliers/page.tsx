import type { Metadata } from "next";

import { SupplierList } from "@/components/catalog/supplier-list";

export const metadata: Metadata = { title: "Suppliers" };

export default function SuppliersPage() {
  return <SupplierList />;
}
