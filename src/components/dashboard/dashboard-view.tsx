"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { MartFlowLogo } from "@/components/brand/martflow-logo";
import { SalesBarChart } from "@/components/charts/sales-bar-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";
import { getEmployeeDashboardCounts } from "@/services/employees";
import { getDashboardSummary, type DashboardSummary } from "@/services/reports";
import { listProducts } from "@/services/products";
import { listSales, salesByDay } from "@/services/sales";
import { ensureOperationalData } from "@/services/storefront";
import type { Product, Sale } from "@/types";

export function DashboardView() {
  const { profile } = useAuth();
  const canViewEmployees = hasPermission(profile?.permissions, "employees.view");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [staff, setStaff] = useState<{
    total: number;
    active: number;
    inactive: number;
    managers: number;
  } | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (profile) {
        await ensureOperationalData(profile.id);
      }
      const staffPromise = canViewEmployees
        ? getEmployeeDashboardCounts()
        : Promise.resolve(null);
      const [nextSummary, products, nextSales, nextStaff] = await Promise.all([
        getDashboardSummary(),
        listProducts(),
        listSales(),
        staffPromise,
      ]);
      if (cancelled) {
        return;
      }
      setSummary(nextSummary);
      setSales(nextSales);
      setStaff(nextStaff);
      setLowStock(products.filter((product) => product.currentStock <= product.minimumStock));
    }
    void load().catch((loadError: unknown) => {
      if (!cancelled) {
        setError(loadError instanceof Error ? loadError.message : "Could not load dashboard.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [canViewEmployees, profile]);

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (!summary) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <MartFlowLogo size="sm" surface="adaptive" />
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Operations overview</h2>
          <p className="text-sm text-muted-foreground">
            Live grocery stock, POS receipts, and this week’s sales.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Revenue" value={summary.revenue === null ? null : formatMoney(summary.revenue)} />
        <MetricCard
          label="Stock value"
          value={summary.stockValue === null ? null : formatMoney(summary.stockValue)}
        />
        <MetricCard label="Low stock items" value={summary.lowStockCount} />
        <MetricCard
          label="Today's cash sales"
          value={summary.openShiftCash === null ? null : formatMoney(summary.openShiftCash)}
        />
      </div>
      {staff ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total employees" value={staff.total} />
          <MetricCard label="Active employees" value={staff.active} />
          <MetricCard label="Inactive employees" value={staff.inactive} />
          <MetricCard label="Managers" value={staff.managers} />
        </div>
      ) : null}
      <SalesBarChart
        title="POS sales"
        description="Completed checkout totals for the last 7 days."
        data={salesByDay(sales)}
      />
      {lowStock.length === 0 ? (
        <EmptyState title="Stock is healthy" message="No grocery items are at or below minimum stock." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Low stock</th>
                <th className="px-3 py-2 font-medium">SKU</th>
                <th className="px-3 py-2 font-medium">On hand</th>
                <th className="px-3 py-2 font-medium">Minimum</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map((product) => (
                <tr key={product.id} className="border-t border-border">
                  <td className="px-3 py-2">{product.name}</td>
                  <td className="px-3 py-2">{product.sku}</td>
                  <td className="px-3 py-2">{product.currentStock}</td>
                  <td className="px-3 py-2">{product.minimumStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
