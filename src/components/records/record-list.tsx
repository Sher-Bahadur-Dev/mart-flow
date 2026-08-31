"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Column<T> = {
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
};

export function RecordList<T extends { id: string }>({
  title,
  description,
  action,
  load,
  columns,
  rowHref,
  emptyMessage,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  load: () => Promise<T[]>;
  columns: Column<T>[];
  rowHref?: (row: T) => string;
  emptyMessage: string;
}) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void load()
      .then((data) => {
        if (!cancelled) {
          setRows(data);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load records.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {rows === null && !error ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}
      {rows && rows.length === 0 ? <EmptyState message={emptyMessage} /> : null}
      {rows && rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <th key={column.header} className={cn("px-3 py-2 font-medium", column.className)}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const href = rowHref?.(row);
                return (
                  <tr key={row.id} className="border-t border-border">
                    {columns.map((column, index) => (
                      <td key={`${row.id}-${column.header}`} className={cn("px-3 py-2", column.className)}>
                        {href && index === 0 ? (
                          <Link href={href} className="font-medium underline-offset-4 hover:underline">
                            {column.cell(row)}
                          </Link>
                        ) : (
                          column.cell(row)
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
