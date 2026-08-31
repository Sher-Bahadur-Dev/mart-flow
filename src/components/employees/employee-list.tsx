"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FormAlert } from "@/components/ui/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { hasPermission, isOwnerRole, ROLE_LABELS, ROLES, roleBand } from "@/lib/permissions";
import {
  deleteEmployeeRecord,
  listEmployees,
  sendEmployeePasswordReset,
  setEmployeeActive,
} from "@/services/employees";
import { listStores } from "@/services/stores";
import type { Employee, Store } from "@/types";

export function EmployeeList() {
  const { profile } = useAuth();
  const canCreate = hasPermission(profile?.permissions, "employees.create");
  const canEdit = hasPermission(profile?.permissions, "employees.update");
  const canDelete = hasPermission(profile?.permissions, "employees.delete");
  const [rows, setRows] = useState<Employee[] | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "REMOVED">("ALL");
  const [role, setRole] = useState("ALL");
  const [storeId, setStoreId] = useState("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ type: "deactivate" | "delete"; employee: Employee } | null>(
    null,
  );

  const refresh = useCallback(async () => {
    const [employees, storeRows] = await Promise.all([listEmployees(), listStores()]);
    setRows(employees);
    setStores(storeRows);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listEmployees(), listStores()])
      .then(([employees, storeRows]) => {
        if (cancelled) {
          return;
        }
        setRows(employees);
        setStores(storeRows);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load employees.");
          setRows([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const storeName = useCallback(
    (id: string | null) => {
      if (!id) {
        return "—";
      }
      return stores.find((store) => store.id === id)?.name ?? id;
    },
    [stores],
  );

  const filtered = useMemo(() => {
    if (!rows) {
      return [];
    }
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (status === "ACTIVE" && (!row.isActive || row.removed)) {
        return false;
      }
      if (status === "INACTIVE" && (row.isActive || row.removed)) {
        return false;
      }
      if (status === "REMOVED" && !row.removed) {
        return false;
      }
      if (role !== "ALL" && row.role !== role) {
        return false;
      }
      if (storeId !== "ALL" && row.storeId !== storeId) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [row.name, row.email, row.phone, row.employeeCode, row.jobTitle]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [rows, search, status, role, storeId]);

  async function run(employeeId: string, action: () => Promise<void>, ok: string) {
    setBusyId(employeeId);
    setError(null);
    setSuccess(null);
    try {
      await action();
      await refresh();
      setSuccess(ok);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "That action could not be completed.");
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  }

  function actionsFor(row: Employee) {
    const lockOwner = isOwnerRole(row.role);
    const lockSelf = profile?.id === row.userId;
    return (
      <div className="flex flex-wrap gap-1" onClick={(event) => event.stopPropagation()}>
        <Link href={`/employees/${row.id}`}>
          <Button size="sm" variant="outline">
            View
          </Button>
        </Link>
        {canEdit ? (
          <Link href={`/employees/${row.id}/edit`}>
            <Button size="sm" variant="outline">
              Edit
            </Button>
          </Link>
        ) : null}
        {canEdit && !lockOwner && !lockSelf ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busyId === row.id}
            onClick={() => {
              if (row.isActive) {
                setConfirm({ type: "deactivate", employee: row });
                return;
              }
              void run(row.id, async () => {
                await setEmployeeActive(row.id, true, profile!.id);
              }, "Employee activated.");
            }}
          >
            {row.isActive ? "Deactivate" : row.removed ? "Restore" : "Activate"}
          </Button>
        ) : null}
        {canEdit ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busyId === row.id}
            onClick={() =>
              void run(row.id, () => sendEmployeePasswordReset(row.email), "Password reset email sent.")
            }
          >
            Reset password
          </Button>
        ) : null}
        {canDelete && !lockOwner && !lockSelf && !row.removed ? (
          <Button
            size="sm"
            variant="destructive"
            disabled={busyId === row.id}
            onClick={() => setConfirm({ type: "delete", employee: row })}
          >
            Remove
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <PermissionGuard permission="employees.view">
      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Employees</h2>
            <p className="text-sm text-muted-foreground">
              Staff records, roles, store assignment, and active status.
            </p>
          </div>
          {canCreate ? (
            <Link href="/employees/new">
              <Button>Add employee</Button>
            </Link>
          ) : null}
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          <Input
            placeholder="Search name, email, code, phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="REMOVED">Removed</option>
          </Select>
          <Select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="ALL">All roles</option>
            {ROLES.map((item) => (
              <option key={item} value={item}>
                {ROLE_LABELS[item]}
              </option>
            ))}
          </Select>
          <Select value={storeId} onChange={(event) => setStoreId(event.target.value)}>
            <option value="ALL">All stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </Select>
        </div>

        <FormAlert message={error} />
        <FormAlert message={success} tone="success" />

        {rows === null ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : null}

        {rows && rows.length === 0 ? (
          <EmptyState
            title="No employees yet"
            message="Add an employee to assign a role, store, and permissions."
          />
        ) : null}

        {rows && rows.length > 0 && filtered.length === 0 ? (
          <EmptyState
            title="No employees match"
            message="Try a different search or clear the role, store, or status filters."
          />
        ) : null}

        {filtered.length > 0 ? (
          <>
            <div className="grid gap-3 md:hidden">
              {filtered.map((row) => (
                <Card key={row.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{row.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{row.email}</p>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      {row.employeeCode || "No code"} · {row.jobTitle || "No title"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{roleBand(row.role)}</Badge>
                      <Badge>{ROLE_LABELS[row.role]}</Badge>
                      <Badge>{row.removed ? "Removed" : row.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {storeName(row.storeId)} · hired {formatDate(row.hireDate)}
                    </p>
                    {actionsFor(row)}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="bg-muted/50 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Employee code</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Job title</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                    <th className="px-3 py-2 font-medium">Store</th>
                    <th className="px-3 py-2 font-medium">Hire date</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="px-3 py-2">{row.employeeCode || "—"}</td>
                      <td className="px-3 py-2 font-medium">{row.name}</td>
                      <td className="px-3 py-2">{row.email}</td>
                      <td className="px-3 py-2">{row.phone ?? "—"}</td>
                      <td className="px-3 py-2">{row.jobTitle || "—"}</td>
                      <td className="px-3 py-2">{ROLE_LABELS[row.role]}</td>
                      <td className="px-3 py-2">{storeName(row.storeId)}</td>
                      <td className="px-3 py-2">{formatDate(row.hireDate)}</td>
                      <td className="px-3 py-2">
                        <Badge>{row.removed ? "Removed" : row.isActive ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td className="px-3 py-2">{actionsFor(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      <ConfirmDialog
        open={confirm?.type === "deactivate"}
        title="Deactivate employee?"
        description="The record stays in Firestore and is excluded from active staff. It is not deleted."
        confirmLabel="Deactivate"
        destructive
        busy={Boolean(busyId)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm || !profile) {
            return;
          }
          void run(confirm.employee.id, async () => {
            await setEmployeeActive(confirm.employee.id, false, profile.id);
          }, "Employee deactivated.");
        }}
      />
      <ConfirmDialog
        open={confirm?.type === "delete"}
        title="Remove employee?"
        description="The employee stays in Firestore as removed/inactive so sales, purchases, inventory, and audit logs keep their staff IDs. Login is disabled. The Auth user is not deleted."
        confirmLabel="Remove"
        destructive
        busy={Boolean(busyId)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm || !profile) {
            return;
          }
          void run(confirm.employee.id, async () => {
            await deleteEmployeeRecord(confirm.employee.id, profile.id);
          }, "Employee removed. Historical records were kept.");
        }}
      />
    </PermissionGuard>
  );
}
