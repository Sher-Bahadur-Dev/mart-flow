"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/components/auth/auth-provider";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { ReactNode } from "react";

export function PermissionGuard({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { profile } = useAuth();
  if (!hasPermission(profile?.permissions, permission)) {
    return (
      <EmptyState
        title="Access denied"
        message="Your role cannot open this module. Ask the owner if you need access."
      />
    );
  }
  return children;
}
