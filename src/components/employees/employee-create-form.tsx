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
  type EmployeeFormValues,
} from "@/components/employees/employee-form-fields";
import { FormAlert } from "@/components/ui/form-alert";
import { Button } from "@/components/ui/button";
import { EmployeeCreateSchema } from "@/lib/validation";
import { createEmployeeAccount } from "@/services/employees";
import { ensureDefaultStore, listStores } from "@/services/stores";
import type { Store } from "@/types";

export function EmployeeCreateForm() {
  const router = useRouter();
  const { profile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(EmployeeCreateSchema) as Resolver<EmployeeFormValues>,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      employeeCode: "",
      jobTitle: "",
      role: "CASHIER",
      storeId: "",
      hireDate: new Date().toISOString().slice(0, 10),
      salary: "",
      isActive: "true",
      address: "",
      emergencyContact: "",
    },
  });

  useEffect(() => {
    void listStores()
      .then(async (rows) => {
        const next = rows.length > 0 ? rows : ([await ensureDefaultStore()].filter(Boolean) as Store[]);
        setStores(next);
        const firstActive = next.find((store) => store.isActive) ?? next[0];
        if (firstActive && !form.getValues("storeId")) {
          form.setValue("storeId", firstActive.id);
        }
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load stores.");
      });
  }, [form]);

  return (
    <PermissionGuard permission="employees.create">
      <section className="mx-auto max-w-3xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">New employee</h2>
          <p className="text-sm text-muted-foreground">
            Creates a staff profile, assigns role permissions, and links a store. A login is created on a
            secondary Firebase app so you stay signed in. A password reset email is sent so the employee can
            set their password.
          </p>
        </div>
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit(async (values) => {
            setError(null);
            try {
              const employee = await createEmployeeAccount({
                name: values.name,
                email: values.email,
                phone: values.phone,
                role: values.role === "SUPER_ADMIN" ? "CASHIER" : values.role,
                employeeCode: values.employeeCode,
                jobTitle: values.jobTitle,
                storeId: values.storeId,
                hireDate: new Date(values.hireDate),
                salary: parseSalary(values.salary),
                isActive: values.isActive === "true",
                address: values.address || null,
                emergencyContact: values.emergencyContact || null,
                actorId: profile?.id,
              });
              router.replace(`/employees/${employee?.id ?? ""}`);
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : "Could not create employee.");
            }
          })}
        >
          <FormAlert message={error} />
          {stores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No stores found. Load demo data from Settings so employees can be linked to a real store.
            </p>
          ) : null}
          <EmployeeFormFields
            register={form.register}
            errors={form.formState.errors}
            stores={stores}
            assignableOnly
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={form.formState.isSubmitting || stores.length === 0}>
              {form.formState.isSubmitting ? "Saving…" : "Save employee"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/employees")}>
              Cancel
            </Button>
          </div>
        </form>
      </section>
    </PermissionGuard>
  );
}
