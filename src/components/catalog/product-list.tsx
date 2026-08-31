"use client";

import { useCallback } from "react";

import { RecordList } from "@/components/records/record-list";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import { listProducts } from "@/services/products";
import type { Product } from "@/types";

export function ProductList() {
  const load = useCallback(() => listProducts(), []);
  return (
    <RecordList<Product>
      title="Products"
      description="Catalogue, SKUs, pricing, and on-hand stock."
      load={load}
      rowHref={(row) => `/products/${row.id}`}
      emptyMessage="No products yet. Create the owner account or load demo data from Settings."
      columns={[
        { header: "Name", cell: (row) => row.name },
        { header: "SKU", cell: (row) => row.sku },
        { header: "Stock", cell: (row) => row.currentStock },
        { header: "Sell", cell: (row) => formatMoney(row.sellingPrice) },
        {
          header: "Status",
          cell: (row) => <Badge>{row.currentStock <= row.minimumStock ? "Low stock" : row.status}</Badge>,
        },
      ]}
    />
  );
}
