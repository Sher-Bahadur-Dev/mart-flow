import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function FormAlert({
  message,
  tone = "error",
}: {
  message: string | null;
  tone?: "error" | "success" | "info";
}) {
  if (!message) {
    return null;
  }
  return (
    <p
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        tone === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : tone === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-border bg-muted/60 text-foreground",
      )}
      role="status"
    >
      {message}
    </p>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) {
    return null;
  }
  return <p className="text-xs text-destructive">{children}</p>;
}
