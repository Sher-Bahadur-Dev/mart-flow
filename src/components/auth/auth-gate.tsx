"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col gap-4 p-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isConfigured, loading, user, profile, signOut } = useAuth();

  useEffect(() => {
    if (!loading && isConfigured && !user) {
      router.replace("/login");
    }
  }, [isConfigured, loading, router, user]);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!isConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="max-w-md text-center text-sm text-muted-foreground">
          Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* keys to .env.local and enable Email/Password
          in Firebase Authentication.
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthLoadingScreen />;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-medium">This login is not linked to a staff record.</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Ask the store owner to add you from Employees, then sign in again.
        </p>
        <Button
          variant="outline"
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return children;
}
