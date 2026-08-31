"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatDate } from "@/lib/format";
import { PURCHASE_STATUS_LABEL } from "@/services/purchases";
import { getSupplierDetail } from "@/services/suppliers";

export function SupplierDetail({ id }: { id: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getSupplierDetail>> | undefined>(undefined);

  useEffect(() => {
    void getSupplierDetail(id).then(setDetail);
  }, [id]);

  if (detail === undefined) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (!detail) {
    return <EmptyState title="Record not found" message="This supplier does not exist." />;
  }

  const { supplier, products, purchases, outstanding } = detail;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{supplier.name}</h2>
          <p className="text-sm text-muted-foreground">{supplier.company ?? "Supplier"}</p>
        </div>
        <Badge>{supplier.status}</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Phone: {supplier.phone ?? "—"}</p>
          <p>Email: {supplier.email ?? "—"}</p>
          <p>Tax no.: {supplier.taxNumber ?? "—"}</p>
          <p>Outstanding: {formatMoney(outstanding)}</p>
          <p className="sm:col-span-2">Address: {supplier.address ?? "—"}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Products supplied</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {products.map((product) => (
              <li key={product.id}>
                {product.name} · {product.sku} · stock {product.currentStock}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Purchase history</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">Order</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium">Total</th>
                <th className="py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="border-t border-border">
                  <td className="py-2">
                    <Link href={`/purchases/${purchase.id}`} className="underline-offset-4 hover:underline">
                      {purchase.orderNumber}
                    </Link>
                  </td>
                  <td className="py-2">{PURCHASE_STATUS_LABEL[purchase.status]}</td>
                  <td className="py-2">{formatMoney(purchase.total)}</td>
                  <td className="py-2">{formatDate(purchase.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Button variant="outline" onClick={() => router.push("/suppliers")}>
        Back
      </Button>
    </section>
  );
}
