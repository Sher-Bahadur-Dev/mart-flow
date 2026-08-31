"use client";

import { useCallback } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { RecordList } from "@/components/records/record-list";
import { formatMoney, formatDate } from "@/lib/format";
import { listExpenses } from "@/services/expenses";
import { ensureOperationalData } from "@/services/storefront";
import type { Expense } from "@/types";

export function ExpenseList() {
  const { profile } = useAuth();
  const load = useCallback(async () => {
    if (profile) {
      await ensureOperationalData(profile.id);
    }
    return listExpenses();
  }, [profile]);

  return (
    <RecordList<Expense>
      title="Expenses"
      description="Store operating costs, rent, utilities, and maintenance."
      load={load}
      emptyMessage="No expenses yet."
      columns={[
        { header: "Title", cell: (row) => row.title },
        { header: "Category", cell: (row) => row.category },
        { header: "Amount", cell: (row) => formatMoney(row.amount) },
        { header: "Paid by", cell: (row) => row.paymentMethod },
        { header: "Date", cell: (row) => formatDate(row.date) },
      ]}
    />
  );
}
