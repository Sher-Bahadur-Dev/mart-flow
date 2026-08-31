import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          We will email a reset link if that address is registered as staff.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
