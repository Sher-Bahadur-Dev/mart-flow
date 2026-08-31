"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatDate } from "@/lib/format";
import { listCashSessions } from "@/services/cash";
import { ensureOperationalData } from "@/services/storefront";
import type { CashSession } from "@/types";

export function CashView() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<CashSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (profile) {
        await ensureOperationalData(profile.id);
      }
      return listCashSessions();
    })()
      .then((data) => {
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load cash sessions.");
          setRows([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  if (!rows) {
    return <Skeleton className="h-48 w-full" />;
  }

  const open = rows.find((row) => !row.closedAt);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Cash management</h2>
        <p className="text-sm text-muted-foreground">Till sessions, opening float, and cash sales.</p>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {open ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Opening cash</CardDescription>
              <CardTitle className="text-2xl">{formatMoney(open.openingCash)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Cash sales</CardDescription>
              <CardTitle className="text-2xl">{formatMoney(open.cashSales)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Expected in till</CardDescription>
              <CardTitle className="text-2xl">{formatMoney(open.expectedCash ?? 0)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr>
                <th className="py-2 font-medium">Opened</th>
                <th className="py-2 font-medium">Opening</th>
                <th className="py-2 font-medium">Cash sales</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="py-2">{formatDate(row.createdAt)}</td>
                  <td className="py-2">{formatMoney(row.openingCash)}</td>
                  <td className="py-2">{formatMoney(row.cashSales)}</td>
                  <td className="py-2">{row.closedAt ? "Closed" : "Open"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
