"use client";

import { useCallback } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { RecordList } from "@/components/records/record-list";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import { listProducts } from "@/services/products";
import { ensureOperationalData } from "@/services/storefront";
import type { Product } from "@/types";

export function GroceryList() {
  const { profile } = useAuth();
  const load = useCallback(async () => {
    if (profile) {
      const data = await ensureOperationalData(profile.id);
      return data.products;
    }
    return listProducts();
  }, [profile]);
  return (
    <RecordList<Product>
      title="Grocery"
      description="Grocery catalogue with live on-hand stock for POS."
      load={load}
      rowHref={(row) => `/products/${row.id}`}
      emptyMessage="No grocery stock yet. Open POS or load demo data from Settings."
      columns={[
        { header: "Item", cell: (row) => row.name },
        { header: "SKU", cell: (row) => row.sku },
        { header: "On hand", cell: (row) => row.currentStock },
        { header: "Unit", cell: (row) => row.unit },
        { header: "Price", cell: (row) => formatMoney(row.sellingPrice) },
        {
          header: "Status",
          cell: (row) => <Badge>{row.currentStock <= row.minimumStock ? "Low stock" : "In stock"}</Badge>,
        },
      ]}
    />
  );
}
