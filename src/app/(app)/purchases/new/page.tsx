import type { Metadata } from "next";

import { PurchaseCreateForm } from "@/components/purchases/purchase-create-form";

export const metadata: Metadata = { title: "New purchase" };

export default function NewPurchasePage() {
  return <PurchaseCreateForm />;
}
