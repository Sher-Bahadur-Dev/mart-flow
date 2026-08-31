"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { RecordList } from "@/components/records/record-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDate } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { listPurchases, PURCHASE_STATUS_LABEL } from "@/services/purchases";
import { listSuppliers } from "@/services/suppliers";
import { ensureOperationalData } from "@/services/storefront";
import type { Purchase } from "@/types";

export function PurchaseList() {
  const { profile } = useAuth();
  const canCreate = hasPermission(profile?.permissions, "purchases.create");
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    void listSuppliers().then((rows) => {
      setNames(Object.fromEntries(rows.map((row) => [row.id, row.name])));
    });
  }, []);

  const load = useCallback(async () => {
    if (profile) {
      await ensureOperationalData(profile.id);
    }
    return listPurchases();
  }, [profile]);

  return (
    <RecordList<Purchase>
      title="Purchases"
      description="Supplier purchase orders, receiving status, and outstanding amounts."
      action={
        canCreate ? (
          <Link href="/purchases/new">
            <Button>New purchase order</Button>
          </Link>
        ) : null
      }
      load={load}
      rowHref={(row) => `/purchases/${row.id}`}
      emptyMessage="No purchase orders yet. Open this page as owner/manager to load demo orders."
      columns={[
        { header: "Order", cell: (row) => row.orderNumber },
        { header: "Supplier", cell: (row) => names[row.supplierId] ?? row.supplierId },
        { header: "Status", cell: (row) => <Badge>{PURCHASE_STATUS_LABEL[row.status]}</Badge> },
        { header: "Total", cell: (row) => formatMoney(row.total) },
        { header: "Outstanding", cell: (row) => formatMoney(row.outstanding) },
        { header: "Date", cell: (row) => formatDate(row.createdAt) },
      ]}
    />
  );
}
