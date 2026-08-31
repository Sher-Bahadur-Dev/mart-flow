"use client";

import { useCallback, useEffect, useState } from "react";

import { RecordList } from "@/components/records/record-list";
import { formatDate } from "@/lib/format";
import { listInventoryTransactions } from "@/services/inventory";
import { listProducts } from "@/services/products";
import type { InventoryTransaction } from "@/types";

export function InventoryList() {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    void listProducts().then((products) => {
      setNames(Object.fromEntries(products.map((product) => [product.id, product.name])));
    });
  }, []);

  const load = useCallback(() => listInventoryTransactions(), []);
  return (
    <RecordList<InventoryTransaction>
      title="Inventory"
      description="Stock movements. POS sales write a SALE transaction and reduce on-hand qty."
      load={load}
      emptyMessage="No stock movements yet. Demo opening stock appears after you load demo data or open POS."
      columns={[
        { header: "Type", cell: (row) => row.type },
        { header: "Product", cell: (row) => names[row.productId] ?? row.productId },
        { header: "Qty", cell: (row) => row.quantity },
        { header: "New stock", cell: (row) => row.newStock },
        { header: "Reason", cell: (row) => row.reason ?? "—" },
        { header: "Date", cell: (row) => formatDate(row.createdAt) },
      ]}
    />
  );
}
