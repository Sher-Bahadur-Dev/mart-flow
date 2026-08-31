"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";

export function GuestGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { loading, isConfigured, profile } = useAuth();

  useEffect(() => {
    if (!loading && isConfigured && profile) {
      router.replace("/dashboard");
    }
  }, [isConfigured, loading, profile, router]);

  return children;
}
