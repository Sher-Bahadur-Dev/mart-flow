import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Create owner account</h1>
        <p className="text-sm text-muted-foreground">
          Create your owner account to get started with your demo store.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
