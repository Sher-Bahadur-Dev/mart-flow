"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { SaleReceipt } from "@/components/sales/sale-receipt";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getSale } from "@/services/sales";
import type { Sale } from "@/types";

export function SaleDetail({ id }: { id: string }) {
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null | undefined>(undefined);

  useEffect(() => {
    void getSale(id).then(setSale);
  }, [id]);

  if (sale === undefined) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!sale) {
    return <EmptyState title="Record not found" message="This sale does not exist yet." />;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Sale {sale.invoiceNumber}</h2>
          <p className="text-sm text-muted-foreground">Receipt for this POS checkout.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
          <Button variant="outline" onClick={() => router.push("/sales")}>
            Back
          </Button>
        </div>
      </div>
      <SaleReceipt sale={sale} />
    </section>
  );
}
