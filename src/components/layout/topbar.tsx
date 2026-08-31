"use client";

import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { MartFlowLogo } from "@/components/brand/martflow-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/permissions";

type TopbarProps = {
  title: string;
  onOpenSidebar: () => void;
};

export function Topbar({ title, onOpenSidebar }: TopbarProps) {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-3 backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation"
        onClick={onOpenSidebar}
      >
        <Menu className="size-4" />
      </Button>
      <MartFlowLogo size="sm" surface="adaptive" iconOnly className="sm:hidden" />
      <MartFlowLogo size="sm" surface="adaptive" className="hidden sm:inline-flex md:hidden" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold md:text-base">{title}</h1>
      </div>
      {profile ? <Badge className="hidden sm:inline-flex">{ROLE_LABELS[profile.role]}</Badge> : null}
      <ThemeToggle />
      {profile ? (
        <div className="flex items-center gap-2">
          <span className="hidden max-w-40 truncate text-xs text-muted-foreground sm:inline">
            {profile.name}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
          >
            Sign out
          </Button>
        </div>
      ) : null}
    </header>
  );
}
