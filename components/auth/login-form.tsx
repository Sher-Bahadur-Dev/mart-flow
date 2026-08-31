"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, loginWithGoogle } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import type { LoginFormState } from "@/lib/validation/auth";

export function LoginForm() {
  const [clientError, setClientError] = useState<string | null>(null);
  const [state, action, pending] = useActionState<
    LoginFormState | undefined,
    FormData
  >(login, undefined);
  const [googleState, googleAction, googlePending] = useActionState<
    LoginFormState | undefined,
    FormData
  >(loginWithGoogle, undefined);

  const error = clientError ?? googleState?.error ?? state?.error;

  return (
    <div className="space-y-3">
      <form action={action} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="identifier">
            Email or username
          </label>
          <Input
            id="identifier"
            name="identifier"
            type="text"
            placeholder="owner@martflow.local"
            autoComplete="username"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending || googlePending} className="w-full">
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <div className="relative py-1 text-center text-xs text-muted-foreground">
        <span className="bg-card px-2">or</span>
      </div>
      <GoogleSignInButton
        label="Continue with Google"
        pending={googlePending}
        disabled={pending}
        onToken={(formData) => {
          setClientError(null);
          googleAction(formData);
        }}
        onError={setClientError}
      />
      <Link
        href="/signup"
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        Sign up
      </Link>
    </div>
  );
}
