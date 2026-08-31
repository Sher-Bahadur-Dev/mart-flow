import type { Metadata } from "next";

import { SalesList } from "@/components/sales/sales-list";

export const metadata: Metadata = { title: "Sales" };

export default function SalesPage() {
  return <SalesList />;
}
