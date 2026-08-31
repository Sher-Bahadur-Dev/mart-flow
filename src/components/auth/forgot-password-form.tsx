"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import type { z } from "zod";

import { useAuth } from "@/components/auth/auth-provider";
import { FieldError, FormAlert } from "@/components/ui/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForgotPasswordSchema } from "@/lib/validation";

type ForgotValues = z.infer<typeof ForgotPasswordSchema>;

export function ForgotPasswordForm() {
  const { resetPassword, isConfigured, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const form = useForm<ForgotValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <form
      className="space-y-3"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        setSuccess(null);
        if (!isConfigured) {
          setError("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* keys to .env.local.");
          return;
        }
        try {
          await resetPassword(values.email);
          setSuccess("If that email is registered, a reset link is on its way.");
        } catch (submitError) {
          setError(submitError instanceof Error ? submitError.message : "Could not send the reset email.");
        }
      })}
    >
      {!loading && !isConfigured ? (
        <FormAlert message="Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* keys to .env.local." />
      ) : null}
      <FormAlert message={error} />
      <FormAlert message={success} tone="success" />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        <FieldError>{form.formState.errors.email?.message}</FieldError>
      </div>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
