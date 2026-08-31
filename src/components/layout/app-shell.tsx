"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { filterNavItems } from "@/config/navigation";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = filterNavItems(profile?.permissions);
  const current = items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-sidebar-border md:block">
        <Sidebar />
      </aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-64 max-w-[80vw] shadow-xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={current?.label ?? "MartFlow"} onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
