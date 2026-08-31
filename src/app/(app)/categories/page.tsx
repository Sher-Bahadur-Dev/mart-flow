import type { Metadata } from "next";

import { CategoryList } from "@/components/catalog/category-list";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return <CategoryList />;
}
