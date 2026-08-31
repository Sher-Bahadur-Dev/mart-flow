"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatDate } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { approvePurchase, cancelPurchase, getPurchase, PURCHASE_STATUS_LABEL, receivePurchase } from "@/services/purchases";
import { getSupplier } from "@/services/suppliers";
import type { Purchase, Supplier } from "@/types";

export function PurchaseDetail({ id }: { id: string }) {
  const router = useRouter();
  const { profile } = useAuth();
  const canReceive = hasPermission(profile?.permissions, "purchases.receive");
  const [purchase, setPurchase] = useState<Purchase | null | undefined>(undefined);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [qty, setQty] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getPurchase(id).then(async (record) => {
      setPurchase(record);
      if (record) {
        setSupplier(await getSupplier(record.supplierId));
        setQty(
          Object.fromEntries(
            record.items.map((item) => [item.productId, String(item.quantity - item.receivedQuantity)]),
          ),
        );
      }
    });
  }, [id]);

  if (purchase === undefined) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (!purchase) {
    return <EmptyState title="Record not found" message="This purchase order does not exist." />;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{purchase.orderNumber}</h2>
          <p className="text-sm text-muted-foreground">
            {supplier ? `${supplier.name} · ${supplier.company ?? "Supplier"}` : purchase.supplierId}
          </p>
        </div>
        <Badge>{PURCHASE_STATUS_LABEL[purchase.status]}</Badge>
      </div>
      <FormAlert message={error} />
      <Card>
        <CardHeader>
          <CardTitle>Supplier</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Phone: {supplier?.phone ?? "—"}</p>
          <p>Email: {supplier?.email ?? "—"}</p>
          <p className="sm:col-span-2">Address: {supplier?.address ?? "—"}</p>
        </CardContent>
      </Card>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Ordered</th>
              <th className="px-3 py-2 font-medium">Received</th>
              <th className="px-3 py-2 font-medium">Receive now</th>
              <th className="px-3 py-2 font-medium">Line total</th>
            </tr>
          </thead>
          <tbody>
            {purchase.items.map((item) => (
              <tr key={item.productId} className="border-t border-border">
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2">{item.quantity}</td>
                <td className="px-3 py-2">{item.receivedQuantity}</td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    className="w-24"
                    disabled={!canReceive || purchase.status === "CANCELLED" || purchase.status === "RECEIVED" || purchase.status === "DRAFT"}
                    value={qty[item.productId] ?? "0"}
                    onChange={(event) => setQty((current) => ({ ...current, [item.productId]: event.target.value }))}
                  />
                </td>
                <td className="px-3 py-2">{formatMoney(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm">
        Total {formatMoney(purchase.total)} · Outstanding {formatMoney(purchase.outstanding)} ·{" "}
        {formatDate(purchase.createdAt)}
      </p>
      <div className="flex flex-wrap gap-2">
        {canReceive && purchase.status === "DRAFT" ? (
          <Button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                setPurchase(await approvePurchase(id));
              } catch (approveError) {
                setError(approveError instanceof Error ? approveError.message : "Could not approve order.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Approve order
          </Button>
        ) : null}
        {canReceive && purchase.status !== "CANCELLED" && purchase.status !== "RECEIVED" && purchase.status !== "DRAFT" ? (
          <Button
            disabled={busy || !profile}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                const receipts = Object.fromEntries(
                  Object.entries(qty).map(([key, value]) => [key, Number(value) || 0]),
                );
                const next = await receivePurchase(id, receipts, profile!.id);
                setPurchase(next);
              } catch (receiveError) {
                setError(receiveError instanceof Error ? receiveError.message : "Could not receive order.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Receive stock
          </Button>
        ) : null}
        {canReceive && (purchase.status === "ORDERED" || purchase.status === "DRAFT") ? (
          <Button
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                setPurchase(await cancelPurchase(id));
              } catch (cancelError) {
                setError(cancelError instanceof Error ? cancelError.message : "Could not cancel.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Cancel order
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => router.push("/purchases")}>
          Back
        </Button>
      </div>
    </section>
  );
}
