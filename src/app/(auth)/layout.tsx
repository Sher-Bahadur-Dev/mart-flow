import { GuestGate } from "@/components/auth/guest-gate";
import { MartFlowLogo } from "@/components/brand/martflow-logo";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <GuestGate>
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
        <div className="mb-6 text-center">
          <Link href="/login" className="inline-flex justify-center">
            <MartFlowLogo size="lg" surface="adaptive" />
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">Staff sign-in for the mart operating system</p>
        </div>
        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </GuestGate>
  );
}
