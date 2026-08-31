"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signup, signupWithGoogle } from "@/lib/auth/signup";
import type { LoginFormState } from "@/lib/validation/auth";

export function SignupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [state, action, pending] = useActionState<
    LoginFormState | undefined,
    FormData
  >(signup, undefined);
  const [googleState, googleAction, googlePending] = useActionState<
    LoginFormState | undefined,
    FormData
  >(signupWithGoogle, undefined);

  const error = clientError ?? googleState?.error ?? state?.error;

  return (
    <div className="space-y-3">
      <form ref={formRef} action={action} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="storeName">
            Store name
          </label>
          <Input
            id="storeName"
            name="storeName"
            required
            placeholder="Main Store"
            autoComplete="organization"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="name">
            Your name
          </label>
          <Input id="name" name="name" required autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="username">
            Username
          </label>
          <Input
            id="username"
            name="username"
            required
            minLength={3}
            autoComplete="username"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="phone">
            Phone
          </label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="confirmPassword">
            Confirm password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending || googlePending} className="w-full">
          {pending ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <div className="relative py-1 text-center text-xs text-muted-foreground">
        <span className="bg-card px-2">or</span>
      </div>
      <GoogleSignInButton
        label="Continue with Google"
        pending={googlePending}
        disabled={pending}
        extraFields={() => {
          const form = formRef.current;
          if (!form) {
            return {};
          }
          const data = new FormData(form);
          return {
            storeName: String(data.get("storeName") ?? ""),
            name: String(data.get("name") ?? ""),
            username: String(data.get("username") ?? ""),
            phone: String(data.get("phone") ?? ""),
          };
        }}
        onToken={(formData) => {
          setClientError(null);
          googleAction(formData);
        }}
        onError={setClientError}
      />
      <p className="text-center text-xs text-muted-foreground">
        For Google, fill store name and username first. Email and password are
        used only for email sign-up.
      </p>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
