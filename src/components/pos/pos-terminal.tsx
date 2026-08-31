"use client";

import { useEffect, useMemo, useState } from "react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { MartFlowLogo } from "@/components/brand/martflow-logo";
import { SaleReceipt } from "@/components/sales/sale-receipt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { createPosSale } from "@/services/sales";
import { getStoreSettings } from "@/services/settings";
import { ensureOperationalData } from "@/services/storefront";
import type { PaymentMethod, Product, Sale, StoreSettings } from "@/types";

type CartLine = {
  product: Product;
  quantity: number;
};

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "CARD", "BANK_TRANSFER", "OTHER"];

function toPaymentMethod(value: string): PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod) ? (value as PaymentMethod) : "OTHER";
}

export function PosTerminal() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!profile) {
      return;
    }
    void Promise.all([ensureOperationalData(profile.id), getStoreSettings()])
      .then(([data, store]) => {
        if (cancelled) {
          return;
        }
        setProducts(data.products.filter((product) => product.status === "ACTIVE"));
        setSettings(store);
        const methods = store.paymentMethods.map(toPaymentMethod);
        if (methods[0]) {
          setMethod(methods[0]);
        }
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load POS catalogue.");
          setProducts([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products ?? []).filter((product) => {
      if (!term) {
        return true;
      }
      return [product.name, product.sku, product.barcode, product.brand]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [products, search]);

  const subtotal = cart.reduce((sum, line) => sum + line.product.sellingPrice * line.quantity, 0);
  const rate = settings?.taxEnabled ? settings.tax / 100 : 0;
  const tax =
    settings?.taxInclusive && rate > 0 ? subtotal - subtotal / (1 + rate) : subtotal * rate;
  const total = settings?.taxInclusive ? subtotal : subtotal + tax;
  const paidAmount = Number(paid);
  const change = Number.isFinite(paidAmount) ? paidAmount - total : 0;
  const currency = settings?.currency ?? "PKR";
  const allowNegative = settings?.allowNegativeStock ?? false;
  const methods = (settings?.paymentMethods.length ? settings.paymentMethods : PAYMENT_METHODS).map(
    toPaymentMethod,
  );

  function addProduct(product: Product) {
    setReceipt(null);
    setError(null);
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      const nextQty = (existing?.quantity ?? 0) + 1;
      if (!allowNegative && nextQty > product.currentStock) {
        setError(`${product.name} only has ${product.currentStock} in stock.`);
        return current;
      }
      if (existing) {
        return current.map((line) =>
          line.product.id === product.id ? { ...line, quantity: nextQty } : line,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function setQty(productId: string, quantity: number) {
    setCart((current) =>
      current
        .map((line) => {
          if (line.product.id !== productId) {
            return line;
          }
          const next = allowNegative
            ? Math.max(0, quantity)
            : Math.max(0, Math.min(quantity, line.product.currentStock));
          return { ...line, quantity: next };
        })
        .filter((line) => line.quantity > 0),
    );
  }

  return (
    <PermissionGuard permission="pos.access">
      <section className="space-y-4">
        <div>
          <MartFlowLogo size="sm" surface="adaptive" className="mb-2" />
          <h2 className="text-lg font-semibold tracking-tight">Point of sale</h2>
          <p className="text-sm text-muted-foreground">
            Search grocery stock, add items, take payment, and print a receipt. Stock updates as soon as the
            sale is completed.
          </p>
        </div>
        <FormAlert message={error} />
        {products === null ? (
          <Skeleton className="h-64 w-full" />
        ) : settings && !settings.posEnabled ? (
          <p className="text-sm text-muted-foreground">
            POS is turned off in Settings. Enable it under POS settings to take sales.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Grocery stock</CardTitle>
                <CardDescription>In-store products available for purchase.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder={
                    settings?.posBarcodeEnabled
                      ? "Search name, SKU, or barcode"
                      : "Search name or SKU"
                  }
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <div className="grid max-h-[28rem] gap-2 overflow-y-auto sm:grid-cols-2">
                  {visible.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      disabled={(!allowNegative && product.currentStock < 1) || busy}
                      className="rounded-lg border border-border p-3 text-left hover:bg-muted disabled:opacity-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{product.name}</p>
                        <Badge>{product.currentStock} in stock</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                      <p className="mt-1 text-sm">{formatMoney(product.sellingPrice, currency)}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cart</CardTitle>
                <CardDescription>Totals update as you add grocery items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tap a product to start a sale.</p>
                ) : (
                  <ul className="space-y-2">
                    {cart.map((line) => (
                      <li key={line.product.id} className="flex items-center gap-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{line.product.name}</p>
                          <p className="text-muted-foreground">{formatMoney(line.product.sellingPrice, currency)}</p>
                        </div>
                        <Input
                          type="number"
                          min={1}
                          max={line.product.currentStock}
                          className="w-16"
                          value={line.quantity}
                          onChange={(event) => setQty(line.product.id, Number(event.target.value))}
                        />
                        <span className="w-20 text-right">
                          {formatMoney(line.product.sellingPrice * line.quantity, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-1 border-t border-border pt-3 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatMoney(subtotal, currency)}</span>
                  </div>
                  {settings?.taxEnabled ? (
                    <div className="flex justify-between">
                      <span>{settings.taxLabel}</span>
                      <span>{formatMoney(tax, currency)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatMoney(total, currency)}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="method">Payment</Label>
                  <Select
                    id="method"
                    value={method}
                    onChange={(event) => setMethod(toPaymentMethod(event.target.value))}
                  >
                    {methods.map((item) => (
                      <option key={item} value={item}>
                        {item.replace("_", " ")}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="paid">Amount paid</Label>
                  <Input
                    id="paid"
                    type="number"
                    min={0}
                    value={paid}
                    onChange={(event) => setPaid(event.target.value)}
                    placeholder={String(total || "")}
                  />
                  <p className="text-xs text-muted-foreground">
                    Change: {formatMoney(change > 0 ? change : 0, currency)}
                  </p>
                </div>
                <Button
                  className="w-full"
                  disabled={busy || cart.length === 0 || !profile}
                  onClick={async () => {
                    if (!profile) {
                      return;
                    }
                    const amount = Number(paid);
                    const tendered = Number.isFinite(amount) && amount > 0 ? amount : total;
                    setBusy(true);
                    setError(null);
                    try {
                      const sale = await createPosSale({
                        cashierId: profile.id,
                        paymentMethod: method,
                        amountPaid: tendered,
                        lines: cart.map((line) => ({
                          productId: line.product.id,
                          quantity: line.quantity,
                        })),
                      });
                      setReceipt(sale);
                      setCart([]);
                      setPaid("");
                      await ensureOperationalData(profile.id).then((data) => {
                        setProducts(data.products.filter((item) => item.status === "ACTIVE"));
                      });
                    } catch (checkoutError) {
                      setError(
                        checkoutError instanceof Error ? checkoutError.message : "Could not complete sale.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? "Recording sale…" : "Complete sale"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        {receipt ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Receipt</h3>
              <Button variant="outline" onClick={() => window.print()}>
                Print receipt
              </Button>
            </div>
            <SaleReceipt sale={receipt} />
          </div>
        ) : null}
      </section>
    </PermissionGuard>
  );
}
