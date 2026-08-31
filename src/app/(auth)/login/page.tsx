import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { AUTH_READY_HINT } from "@/lib/auth/messages";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">{AUTH_READY_HINT}</p>
      </div>
      <LoginForm />
    </div>
  );
}
