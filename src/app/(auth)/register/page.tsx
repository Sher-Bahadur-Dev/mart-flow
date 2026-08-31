import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Create owner account</h1>
        <p className="text-sm text-muted-foreground">
          The first account is the store owner. Employees are added later from the staff module.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
