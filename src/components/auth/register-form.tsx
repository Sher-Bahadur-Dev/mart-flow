"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { z } from "zod";

import { useAuth } from "@/components/auth/auth-provider";
import { FieldError, FormAlert } from "@/components/ui/form-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisterSchema } from "@/lib/validation";
import { ownerExists } from "@/services/users";

type RegisterValues = z.infer<typeof RegisterSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { signUp, isConfigured, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [ownerAlreadyExists, setOwnerAlreadyExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (loading || !isConfigured) {
      return;
    }
    void ownerExists().then(setOwnerAlreadyExists);
  }, [isConfigured, loading]);

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
          await signUp({
            name: values.name,
            email: values.email,
            password: values.password,
          });
          router.replace("/dashboard");
        } catch (submitError) {
          setError(submitError instanceof Error ? submitError.message : "Could not create the owner account.");
        }
      })}
    >
      {!loading && !isConfigured ? (
        <FormAlert message="Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* keys to .env.local." />
      ) : null}
      {ownerAlreadyExists ? (
        <FormAlert message="An owner account already exists. Staff logins are created from Employees." />
      ) : null}
      <FormAlert message={error} />
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" autoComplete="name" {...form.register("name")} />
        <FieldError>{form.formState.errors.name?.message}</FieldError>
      </div>
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
            autoComplete="new-password"
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
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          {...form.register("confirmPassword")}
        />
        <FieldError>{form.formState.errors.confirmPassword?.message}</FieldError>
      </div>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || ownerAlreadyExists}>
        {form.formState.isSubmitting ? "Creating account…" : "Create owner account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
