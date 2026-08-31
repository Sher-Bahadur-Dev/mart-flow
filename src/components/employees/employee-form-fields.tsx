"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { FieldError } from "@/components/ui/form-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ASSIGNABLE_ROLES, ROLE_LABELS, ROLES, type Role } from "@/lib/permissions";
import type { Store } from "@/types";

export type EmployeeFormValues = {
  name: string;
  email: string;
  phone: string;
  employeeCode: string;
  jobTitle: string;
  role: Role;
  storeId: string;
  hireDate: string;
  salary?: string;
  isActive: "true" | "false";
  address?: string;
  emergencyContact?: string;
};

export function EmployeeFormFields({
  register,
  errors,
  stores,
  lockOwnerFields,
  disabled,
  assignableOnly,
  onRoleChange,
}: {
  register: UseFormRegister<EmployeeFormValues>;
  errors: FieldErrors<EmployeeFormValues>;
  stores: Store[];
  lockOwnerFields?: boolean;
  disabled?: boolean;
  assignableOnly?: boolean;
  onRoleChange?: (role: Role) => void;
}) {
  const roles = assignableOnly ? ASSIGNABLE_ROLES : ROLES;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" disabled={disabled} {...register("name")} />
        <FieldError>{errors.name?.message}</FieldError>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="off" disabled={disabled} {...register("email")} />
        <FieldError>{errors.email?.message}</FieldError>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" disabled={disabled} {...register("phone")} />
        <FieldError>{errors.phone?.message}</FieldError>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="employeeCode">Employee code</Label>
        <Input id="employeeCode" disabled={disabled} {...register("employeeCode")} />
        <FieldError>{errors.employeeCode?.message}</FieldError>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="jobTitle">Job title</Label>
        <Input id="jobTitle" disabled={disabled} {...register("jobTitle")} />
        <FieldError>{errors.jobTitle?.message}</FieldError>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="role">Role</Label>
        <Select
          id="role"
          disabled={disabled || lockOwnerFields}
          {...register("role", {
            onChange: (event) => onRoleChange?.(event.target.value as Role),
          })}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
        {lockOwnerFields ? (
          <p className="text-xs text-muted-foreground">The owner role cannot be changed.</p>
        ) : null}
        <FieldError>{errors.role?.message}</FieldError>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="storeId">Store</Label>
        <Select id="storeId" disabled={disabled} {...register("storeId")}>
          <option value="">Select a store</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name} ({store.id}){store.isActive ? "" : " — inactive"}
            </option>
          ))}
        </Select>
        <FieldError>{errors.storeId?.message}</FieldError>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="hireDate">Hire date</Label>
        <Input id="hireDate" type="date" disabled={disabled} {...register("hireDate")} />
        <FieldError>{errors.hireDate?.message}</FieldError>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="salary">Salary</Label>
        <Input id="salary" type="number" min="0" step="1" disabled={disabled} {...register("salary")} />
        <FieldError>{errors.salary?.message}</FieldError>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="isActive">Status</Label>
        <Select id="isActive" disabled={disabled || lockOwnerFields} {...register("isActive")}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="address">Address (optional)</Label>
        <Input id="address" disabled={disabled} {...register("address")} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="emergencyContact">Emergency contact (optional)</Label>
        <Input id="emergencyContact" disabled={disabled} {...register("emergencyContact")} />
      </div>
    </div>
  );
}

export function parseSalary(value?: string) {
  if (!value || !value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
