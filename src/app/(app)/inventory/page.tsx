import type { Metadata } from "next";

import { InventoryList } from "@/components/catalog/inventory-list";

export const metadata: Metadata = { title: "Inventory" };

export default function InventoryPage() {
  return <InventoryList />;
}
