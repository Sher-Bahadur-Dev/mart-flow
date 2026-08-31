"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { listNotifications, markNotificationRead } from "@/services/notifications";
import { ensureOperationalData } from "@/services/storefront";
import type { AppNotification } from "@/types";

export function NotificationList() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<AppNotification[] | null>(null);

  async function reload() {
    if (profile) {
      await ensureOperationalData(profile.id);
    }
    setRows(await listNotifications());
  }

  useEffect(() => {
    void reload().catch(() => setRows([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  if (!rows) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Notifications</h2>
        <p className="text-sm text-muted-foreground">Stock alerts, purchase updates, and POS notices.</p>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <Card key={row.id}>
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>{row.title}</CardTitle>
                <p className="text-xs text-muted-foreground">{formatDateTime(row.createdAt)}</p>
              </div>
              {row.read ? null : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await markNotificationRead(row.id);
                    await reload();
                  }}
                >
                  Mark read
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{row.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
