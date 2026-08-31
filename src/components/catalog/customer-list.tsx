"use client";

import { useCallback } from "react";

import { RecordList } from "@/components/records/record-list";
import { Badge } from "@/components/ui/badge";
import { listCustomers } from "@/services/customers";
import type { Customer } from "@/types";

export function CustomerList() {
  const load = useCallback(() => listCustomers(), []);
  return (
    <RecordList<Customer>
      title="Customers"
      description="Walk-in and registered customers."
      load={load}
      rowHref={(row) => `/customers/${row.id}`}
      emptyMessage="No customers yet. Load demo data from Settings."
      columns={[
        { header: "Name", cell: (row) => row.name },
        { header: "Type", cell: (row) => (row.customerType === "WALK_IN_CUSTOMER" ? "Walk-in" : "Registered") },
        { header: "Phone", cell: (row) => row.phone ?? "—" },
        { header: "Status", cell: (row) => <Badge>{row.status}</Badge> },
      ]}
    />
  );
}
