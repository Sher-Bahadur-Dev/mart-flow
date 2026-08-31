"use client";

import { useCallback } from "react";

import { RecordList } from "@/components/records/record-list";
import { Badge } from "@/components/ui/badge";
import { listCategories } from "@/services/categories";
import type { Category } from "@/types";

export function CategoryList() {
  const load = useCallback(() => listCategories(), []);
  return (
    <RecordList<Category>
      title="Categories"
      description="Product categories used by the catalogue."
      load={load}
      emptyMessage="No categories yet. Load demo data from Settings to populate the catalogue."
      columns={[
        { header: "Name", cell: (row) => row.name },
        { header: "Status", cell: (row) => <Badge>{row.status}</Badge> },
      ]}
    />
  );
}
