"use client";

import { useCallback } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { RecordList } from "@/components/records/record-list";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDateTime } from "@/lib/format";
import { listSales } from "@/services/sales";
import { ensureOperationalData } from "@/services/storefront";
import type { Sale } from "@/types";

export function SalesList() {
  const { profile } = useAuth();
  const load = useCallback(async () => {
    if (profile) {
      const data = await ensureOperationalData(profile.id);
      return data.sales;
    }
    return listSales();
  }, [profile]);
  return (
    <RecordList<Sale>
      title="Sales"
      description="POS invoices, receipts, and completed checkout totals."
      load={load}
      rowHref={(row) => `/sales/${row.id}`}
      emptyMessage="No sales yet. Complete a checkout in POS or load demo data."
      columns={[
        { header: "Invoice", cell: (row) => row.invoiceNumber },
        { header: "Items", cell: (row) => row.items.reduce((sum, item) => sum + item.quantity, 0) },
        { header: "Total", cell: (row) => formatMoney(row.total) },
        { header: "Payment", cell: (row) => row.paymentMethod },
        { header: "Status", cell: (row) => <Badge>{row.status}</Badge> },
        { header: "When", cell: (row) => formatDateTime(row.createdAt) },
      ]}
    />
  );
}
