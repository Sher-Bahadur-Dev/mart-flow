"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { listProducts } from "@/services/products";
import { createPurchaseOrder } from "@/services/purchases";
import { listSuppliers } from "@/services/suppliers";
import type { Product, Supplier } from "@/types";

export function PurchaseCreateForm() {
  const router = useRouter();
  const { profile } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [lines, setLines] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([listSuppliers(), listProducts()]).then(([nextSuppliers, nextProducts]) => {
      setSuppliers(nextSuppliers);
      setProducts(nextProducts);
      setSupplierId(nextSuppliers[0]?.id ?? "");
      setProductId(nextProducts[0]?.id ?? "");
    });
  }, []);

  return (
    <PermissionGuard permission="purchases.create">
      <section className="mx-auto max-w-2xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">New purchase order</h2>
          <p className="text-sm text-muted-foreground">Create a supplier order. Receive it later to add stock.</p>
        </div>
        <FormAlert message={error} />
        <div className="space-y-1.5">
          <Label htmlFor="supplier">Supplier</Label>
          <Select id="supplier" value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-40 flex-1 space-y-1.5">
            <Label htmlFor="product">Product</Label>
            <Select id="product" value={productId} onChange={(event) => setProductId(event.target.value)}>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-24 space-y-1.5">
            <Label htmlFor="qty">Qty</Label>
            <Input id="qty" type="number" min={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const product = products.find((item) => item.id === productId);
              const qty = Math.max(1, Number(quantity) || 1);
              if (!product) {
                return;
              }
              setLines((current) => [...current, { product, quantity: qty }]);
            }}
          >
            Add line
          </Button>
        </div>
        <ul className="space-y-1 text-sm">
          {lines.map((line, index) => (
            <li key={`${line.product.id}-${index}`} className="flex justify-between gap-2">
              <span>
                {line.product.name} × {line.quantity}
              </span>
              <button type="button" className="text-destructive" onClick={() => setLines((current) => current.filter((_, i) => i !== index))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Button
            disabled={busy || !profile}
            onClick={async () => {
              if (!profile) {
                return;
              }
              setBusy(true);
              setError(null);
              try {
                const purchase = await createPurchaseOrder({
                  supplierId,
                  createdBy: profile.id,
                  items: lines.map((line) => ({
                    productId: line.product.id,
                    name: line.product.name,
                    sku: line.product.sku,
                    quantity: line.quantity,
                    unitPrice: line.product.purchasePrice,
                  })),
                });
                router.replace(`/purchases/${purchase?.id ?? ""}`);
              } catch (submitError) {
                setError(submitError instanceof Error ? submitError.message : "Could not create order.");
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : "Save order"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/purchases")}>
            Cancel
          </Button>
        </div>
      </section>
    </PermissionGuard>
  );
}
