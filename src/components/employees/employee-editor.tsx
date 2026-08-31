"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PermissionGuard } from "@/components/auth/permission-guard";
import { useAuth } from "@/components/auth/auth-provider";
import {
  EmployeeFormFields,
  parseSalary,
  toDateInput,
  type EmployeeFormValues,
} from "@/components/employees/employee-form-fields";
import { EmptyState } from "@/components/ui/empty-state";
import { FormAlert } from "@/components/ui/form-alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission, isOwnerRole, PERMISSIONS, ROLE_PERMISSIONS, type Permission } from "@/lib/permissions";
import { EmployeeUpdateSchema } from "@/lib/validation";
import { getEmployee, updateEmployeeRecord } from "@/services/employees";
import { listStores } from "@/services/stores";
import { getUserProfile } from "@/services/users";
import type { Employee, Store } from "@/types";

export function EmployeeEditor({ id }: { id: string }) {
  const router = useRouter();
  const { profile } = useAuth();
  const canEdit = hasPermission(profile?.permissions, "employees.update");
  const [employee, setEmployee] = useState<Employee | null | undefined>(undefined);
  const [stores, setStores] = useState<Store[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(EmployeeUpdateSchema) as Resolver<EmployeeFormValues>,
  });

  useEffect(() => {
    void Promise.all([getEmployee(id), listStores()])
      .then(async ([record, storeRows]) => {
        setEmployee(record);
        setStores(storeRows);
        if (record) {
          form.reset({
            name: record.name,
            email: record.email,
            phone: record.phone ?? "",
            employeeCode: record.employeeCode,
            jobTitle: record.jobTitle,
            role: record.role,
            storeId: record.storeId ?? storeRows[0]?.id ?? "",
            hireDate: toDateInput(record.hireDate),
            salary: record.salary == null ? "" : String(record.salary),
            isActive: record.isActive ? "true" : "false",
            address: record.address ?? "",
            emergencyContact: record.emergencyContact ?? "",
          });
          if (record.userId) {
            const user = await getUserProfile(record.userId);
            setPermissions(user?.permissions ?? [...(ROLE_PERMISSIONS[record.role] ?? [])]);
          } else {
            setPermissions([...(ROLE_PERMISSIONS[record.role] ?? [])]);
          }
        }
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load employee.");
        setEmployee(null);
      });
  }, [form, id]);

  if (employee === undefined) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!employee) {
    return <EmptyState title="Record not found" message="This employee does not exist." />;
  }

  if (!canEdit) {
    return (
      <PermissionGuard permission="employees.update">
        <EmptyState title="Access denied" message="You cannot edit employees." />
      </PermissionGuard>
    );
  }

  const lockOwnerFields = isOwnerRole(employee.role);

  return (
    <PermissionGuard permission="employees.update">
      <section className="mx-auto max-w-3xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Edit {employee.name}</h2>
          <p className="text-sm text-muted-foreground">{employee.email}</p>
        </div>
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            setError(null);
            setSuccess(null);
            try {
              await updateEmployeeRecord(id, {
                name: values.name,
                email: values.email,
                phone: values.phone,
                role: lockOwnerFields ? employee.role : values.role,
                employeeCode: values.employeeCode,
                jobTitle: values.jobTitle,
                storeId: values.storeId || employee.storeId || "",
                hireDate: new Date(values.hireDate),
                salary: parseSalary(values.salary),
                isActive: lockOwnerFields ? true : values.isActive === "true",
                address: values.address || null,
                emergencyContact: values.emergencyContact || null,
                permissions: lockOwnerFields ? undefined : permissions,
                actorId: profile?.id,
              });
              setSuccess("Employee updated.");
              const next = await getEmployee(id);
              setEmployee(next);
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : "Could not update employee.");
            }
          })}
        >
          <FormAlert message={error} />
          <FormAlert message={success} tone="success" />
          <EmployeeFormFields
            register={form.register}
            errors={form.formState.errors}
            stores={stores}
            lockOwnerFields={lockOwnerFields}
            assignableOnly={!lockOwnerFields}
            onRoleChange={(role) => {
              if (!lockOwnerFields) {
                setPermissions([...(ROLE_PERMISSIONS[role] ?? [])]);
              }
            }}
          />
          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Employee permissions</p>
            <p className="text-xs text-muted-foreground">
              Changing the role loads that role&apos;s defaults. You can then grant or revoke individual
              permissions for this person.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {PERMISSIONS.map((permission) => (
                <label key={permission} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled={lockOwnerFields}
                    checked={permissions.includes(permission)}
                    onChange={() => {
                      setPermissions((current) =>
                        current.includes(permission)
                          ? current.filter((item) => item !== permission)
                          : [...current, permission],
                      );
                    }}
                  />
                  {permission}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push(`/employees/${id}`)}>
              Cancel
            </Button>
          </div>
        </form>
      </section>
    </PermissionGuard>
  );
}
