"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { getCustomer } from "@/services/customers";
import type { Customer } from "@/types";

export function CustomerDetail({ id }: { id: string }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);

  useEffect(() => {
    void getCustomer(id).then(setCustomer);
  }, [id]);

  if (customer === undefined) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (!customer) {
    return <EmptyState title="Record not found" message="This customer does not exist." />;
  }

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{customer.name}</h2>
          <p className="text-sm text-muted-foreground">
            {customer.customerType === "WALK_IN_CUSTOMER" ? "Walk-in" : "Registered"}
          </p>
        </div>
        <Badge>{customer.status}</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Phone: {customer.phone ?? "—"}</p>
          <p>Email: {customer.email ?? "—"}</p>
          <p>Address: {customer.address ?? "—"}</p>
          <p>Balance: {formatMoney(customer.balance)}</p>
        </CardContent>
      </Card>
      <Button variant="outline" onClick={() => router.push("/customers")}>
        Back
      </Button>
    </section>
  );
}
