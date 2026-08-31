import type { Metadata } from "next";

import { PurchaseList } from "@/components/purchases/purchase-list";

export const metadata: Metadata = { title: "Purchases" };

export default function PurchasesPage() {
  return <PurchaseList />;
}
