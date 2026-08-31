"use client";

import { useEffect, useState } from "react";

import { formatMoney, formatDateTime } from "@/lib/format";
import { MartFlowLogo } from "@/components/brand/martflow-logo";
import { getStoreSettings } from "@/services/settings";
import type { Sale, StoreSettings } from "@/types";

export function SaleReceipt({ sale }: { sale: Sale }) {
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    void getStoreSettings().then(setSettings);
  }, []);

  const storeName = settings?.receiptHeader || settings?.storeName || "MartFlow";
  const footer = settings?.receiptFooter || "Thank you for shopping with us.";
  const taxLabel = settings?.taxLabel || "Tax";
  const currency = settings?.currency || "PKR";
  const showTax = settings?.receiptShowTax !== false;

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-border bg-card p-4 text-sm print:max-w-none print:border-0">
      <div className="space-y-1 text-center">
        <div className="flex justify-center">
          <MartFlowLogo size="sm" surface="brand" />
        </div>
        <p className="font-semibold">{storeName}</p>
        {settings?.address ? <p className="text-xs text-muted-foreground">{settings.address}</p> : null}
        {settings?.phone ? <p className="text-xs text-muted-foreground">{settings.phone}</p> : null}
        <p className="text-muted-foreground">Sales receipt</p>
        <p className="font-medium">{sale.invoiceNumber}</p>
        <p className="text-xs text-muted-foreground">{formatDateTime(sale.createdAt)}</p>
      </div>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-1 font-medium">Item</th>
            <th className="py-1 font-medium">Qty</th>
            <th className="py-1 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item) => (
            <tr key={`${item.productId}-${item.sku}`} className="border-b border-border/60">
              <td className="py-1">
                <div>{item.name}</div>
                <div className="text-xs text-muted-foreground">{formatMoney(item.unitPrice, currency)} each</div>
              </td>
              <td className="py-1">{item.quantity}</td>
              <td className="py-1 text-right">{formatMoney(item.lineTotal, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-3 space-y-1">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>{formatMoney(sale.subtotal, currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Discount</dt>
          <dd>{formatMoney(sale.discount, currency)}</dd>
        </div>
        {showTax ? (
          <div className="flex justify-between">
            <dt>{taxLabel}</dt>
            <dd>{formatMoney(sale.tax, currency)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between font-semibold">
          <dt>Total</dt>
          <dd>{formatMoney(sale.total, currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Paid ({sale.paymentMethod})</dt>
          <dd>{formatMoney(sale.amountPaid, currency)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Change</dt>
          <dd>{formatMoney(sale.change, currency)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-center text-xs text-muted-foreground">{footer}</p>
    </div>
  );
}
