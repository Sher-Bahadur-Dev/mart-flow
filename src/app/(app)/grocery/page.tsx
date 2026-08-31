import type { Metadata } from "next";

import { GroceryList } from "@/components/catalog/grocery-list";

export const metadata: Metadata = { title: "Grocery" };

export default function GroceryPage() {
  return <GroceryList />;
}
