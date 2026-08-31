"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { SalesBarChart } from "@/components/charts/sales-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { listSales, salesByDay, topSellingProducts } from "@/services/sales";
import { ensureOperationalData } from "@/services/storefront";
import type { Sale } from "@/types";

export function ReportsView() {
  const { profile } = useAuth();
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = profile ? ensureOperationalData(profile.id).then((data) => data.sales) : listSales();
    void run
      .then((rows) => {
        if (!cancelled) {
          setSales(rows);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load reports.");
          setSales([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!sales) {
    return <Skeleton className="h-64 w-full" />;
  }

  const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const tickets = sales.length;
  const top = topSellingProducts(sales);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Reports</h2>
        <p className="text-sm text-muted-foreground">Sales, including POS checkouts, with live grocery totals.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">POS & counter sales</CardTitle>
            <p className="text-2xl font-semibold">{formatMoney(revenue)}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Receipts</CardTitle>
            <p className="text-2xl font-semibold">{tickets}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Average ticket</CardTitle>
            <p className="text-2xl font-semibold">{formatMoney(tickets ? Math.round(revenue / tickets) : 0)}</p>
          </CardHeader>
        </Card>
      </div>
      <SalesBarChart
        title="Sales this week"
        description="Completed POS and counter invoices by day."
        data={salesByDay(sales)}
      />
      <Card>
        <CardHeader>
          <CardTitle>Top grocery items</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">Product</th>
                <th className="py-2 font-medium">Qty sold</th>
                <th className="py-2 font-medium">Sales</th>
              </tr>
            </thead>
            <tbody>
              {top.map((item) => (
                <tr key={item.name} className="border-t border-border">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">{formatMoney(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
