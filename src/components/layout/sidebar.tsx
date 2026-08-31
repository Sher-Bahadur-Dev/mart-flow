"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/auth-provider";
import { MartFlowLogo } from "@/components/brand/martflow-logo";
import { filterNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const items = filterNavItems(profile?.permissions);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <Link href="/dashboard" className="inline-flex min-w-0 items-center" onClick={onNavigate}>
          <MartFlowLogo size="sm" surface="dark" />
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Main">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
