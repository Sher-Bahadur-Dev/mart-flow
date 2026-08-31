"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { useAuth } from "@/components/auth/auth-provider";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FormAlert } from "@/components/ui/form-alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatMoney } from "@/lib/format";
import { hasPermission, isOwnerRole, ROLE_LABELS, roleBand } from "@/lib/permissions";
import {
  deleteEmployeeRecord,
  getEmployee,
  sendEmployeePasswordReset,
  setEmployeeActive,
} from "@/services/employees";
import { getStore } from "@/services/stores";
import { getUserProfile } from "@/services/users";
import type { Employee, Store, UserProfile } from "@/types";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export function EmployeeDetail({ id }: { id: string }) {
  const router = useRouter();
  const { profile } = useAuth();
  const canEdit = hasPermission(profile?.permissions, "employees.update");
  const canDelete = hasPermission(profile?.permissions, "employees.delete");
  const [employee, setEmployee] = useState<Employee | null | undefined>(undefined);
  const [store, setStore] = useState<Store | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"deactivate" | "delete" | null>(null);

  useEffect(() => {
    void getEmployee(id)
      .then(async (record) => {
        setEmployee(record);
        if (record?.storeId) {
          setStore(await getStore(record.storeId));
        }
        if (record?.userId) {
          setUser(await getUserProfile(record.userId));
        }
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load employee.");
        setEmployee(null);
      });
  }, [id]);

  if (employee === undefined) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!employee) {
    return <EmptyState title="Record not found" message="This employee does not exist." />;
  }

  const lockOwner = isOwnerRole(employee.role);
  const lockSelf = profile?.id === employee.userId;
  const band = roleBand(employee.role);

  async function run(action: () => Promise<void>, ok: string) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await action();
      setSuccess(ok);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "That action could not be completed.");
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  return (
    <PermissionGuard permission="employees.view">
      <section className="mx-auto max-w-3xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{employee.name}</h2>
            <p className="text-sm text-muted-foreground">Employee details and account status.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{band}</Badge>
            <Badge>{ROLE_LABELS[employee.role]}</Badge>
            <Badge>{employee.removed ? "Removed" : employee.isActive ? "Active" : "Inactive"}</Badge>
          </div>
        </div>

        <FormAlert message={error} />
        <FormAlert message={success} tone="success" />

        <Card>
          <CardHeader>
            <CardTitle>Personal</CardTitle>
            <CardDescription>Contact and identity fields from the employee record.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Detail label="Name" value={employee.name} />
            <Detail label="Employee code" value={employee.employeeCode} />
            <Detail label="Email" value={employee.email} />
            <Detail label="Phone" value={employee.phone ?? "—"} />
            <div className="sm:col-span-2">
              <Detail label="Address" value={employee.address ?? "—"} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Detail label="Job title" value={employee.jobTitle || "—"} />
            <Detail label="Role" value={ROLE_LABELS[employee.role]} />
            <Detail
              label="Store"
              value={store ? `${store.name} (${store.id})${store.isActive ? "" : " — inactive"}` : employee.storeId ?? "—"}
            />
            <Detail label="Hire date" value={formatDate(employee.hireDate)} />
            <Detail label="Salary" value={employee.salary == null ? "—" : formatMoney(employee.salary)} />
            <Detail label="Status" value={employee.removed ? "Removed" : employee.isActive ? "Active" : "Inactive"} />
            <div className="sm:col-span-2">
              <Detail label="Emergency contact" value={employee.emergencyContact ?? "—"} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Detail label="User ID" value={employee.userId ?? "—"} />
            <Detail label="Account status" value={employee.status} />
            <Detail label="Created" value={formatDate(employee.createdAt)} />
            <Detail label="Updated" value={formatDate(employee.updatedAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>Effective access for this login. Edit them on the employee edit page.</CardDescription>
          </CardHeader>
          <CardContent>
            {user?.permissions.length ? (
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                {user.permissions.map((permission) => (
                  <li key={permission}>{permission}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Permissions follow the assigned role until customized.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Link href={`/employees/${id}/edit`}>
              <Button>Edit</Button>
            </Link>
          ) : null}
          {canEdit && !lockOwner && !lockSelf ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                if (employee.isActive) {
                  setConfirm("deactivate");
                  return;
                }
                void run(async () => {
                  const next = await setEmployeeActive(id, true, profile!.id);
                  setEmployee(next);
                }, "Employee activated.");
              }}
            >
              {employee.isActive ? "Deactivate" : employee.removed ? "Restore" : "Activate"}
            </Button>
          ) : null}
          {canEdit && employee.email ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(
                  () => sendEmployeePasswordReset(employee.email),
                  "Password reset email sent.",
                )
              }
            >
              Reset password
            </Button>
          ) : null}
          {canDelete && !lockOwner && !lockSelf && !employee.removed ? (
            <Button variant="destructive" disabled={busy} onClick={() => setConfirm("delete")}>
              Remove
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => router.push("/employees")}>
            Back
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirm === "deactivate"}
        title="Deactivate employee?"
        description="The record stays in Firestore and is excluded from active staff. It is not deleted."
        confirmLabel="Deactivate"
        destructive
        busy={busy}
        onClose={() => setConfirm(null)}
        onConfirm={() =>
          void run(async () => {
            const next = await setEmployeeActive(id, false, profile!.id);
            setEmployee(next);
          }, "Employee deactivated.")
        }
      />
      <ConfirmDialog
        open={confirm === "delete"}
        title="Remove employee?"
        description="The employee record is kept so sales, purchases, inventory, and audit logs still resolve this staff member. Login is disabled. Firebase Auth is not deleted."
        confirmLabel="Remove"
        destructive
        busy={busy}
        onClose={() => setConfirm(null)}
        onConfirm={() =>
          void run(async () => {
            await deleteEmployeeRecord(id, profile!.id);
            router.replace("/employees");
          }, "Employee removed.")
        }
      />
    </PermissionGuard>
  );
}
