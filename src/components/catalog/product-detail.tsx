"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { getProduct } from "@/services/products";
import type { Product } from "@/types";

export function ProductDetail({ id }: { id: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    void getProduct(id).then(setProduct);
  }, [id]);

  if (product === undefined) {
    return <Skeleton className="h-48 w-full" />;
  }
  if (!product) {
    return <EmptyState title="Record not found" message="This product does not exist." />;
  }

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{product.name}</h2>
          <p className="text-sm text-muted-foreground">{product.sku}</p>
        </div>
        <Badge>{product.status}</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Stock & pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>On hand: {product.currentStock} {product.unit}</p>
          <p>Minimum: {product.minimumStock}</p>
          <p>Cost: {formatMoney(product.purchasePrice)}</p>
          <p>Sell: {formatMoney(product.sellingPrice)}</p>
          <p>Brand: {product.brand ?? "—"}</p>
        </CardContent>
      </Card>
      <Button variant="outline" onClick={() => router.push("/products")}>
        Back
      </Button>
    </section>
  );
}
