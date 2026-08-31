"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { z } from "zod";

import { useAuth } from "@/components/auth/auth-provider";
import { FieldError, FormAlert } from "@/components/ui/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginSchema } from "@/lib/validation";

type LoginValues = z.infer<typeof LoginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { signIn, isConfigured, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form
      className="space-y-3"
      onSubmit={form.handleSubmit(async (values) => {
        setError(null);
        if (!isConfigured) {
          setError("Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* keys to .env.local.");
          return;
        }
        try {
          await signIn(values.email, values.password);
          router.replace("/dashboard");
        } catch (submitError) {
          setError(submitError instanceof Error ? submitError.message : "Sign in failed.");
        }
      })}
    >
      {!loading && !isConfigured ? (
        <FormAlert message="Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* keys to .env.local." />
      ) : null}
      <FormAlert message={error} />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        <FieldError>{form.formState.errors.email?.message}</FieldError>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pr-10"
            {...form.register("password")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 h-9 w-9"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
        <FieldError>{form.formState.errors.password?.message}</FieldError>
      </div>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="underline-offset-4 hover:underline">
          Forgot password
        </Link>
        {" · "}
        <Link href="/register" className="underline-offset-4 hover:underline">
          Create owner account
        </Link>
      </p>
    </form>
  );
}
