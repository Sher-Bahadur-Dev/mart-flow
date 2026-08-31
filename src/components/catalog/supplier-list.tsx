"use client";

import { useCallback } from "react";

import { RecordList } from "@/components/records/record-list";
import { Badge } from "@/components/ui/badge";
import { listSuppliers } from "@/services/suppliers";
import type { Supplier } from "@/types";

export function SupplierList() {
  const load = useCallback(() => listSuppliers(), []);
  return (
    <RecordList<Supplier>
      title="Suppliers"
      description="Vendors used for purchases and demo stock."
      load={load}
      rowHref={(row) => `/suppliers/${row.id}`}
      emptyMessage="No suppliers yet. Load demo data from Settings."
      columns={[
        { header: "Name", cell: (row) => row.name },
        { header: "Company", cell: (row) => row.company ?? "—" },
        { header: "Phone", cell: (row) => row.phone ?? "—" },
        { header: "Status", cell: (row) => <Badge>{row.status}</Badge> },
      ]}
    />
  );
}
