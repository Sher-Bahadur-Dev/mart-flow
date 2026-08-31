import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title?: string;
  message?: string;
  className?: string;
};

export function EmptyState({
  title = "Nothing here yet",
  message = "Records will appear here once this module is connected to live data.",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center",
        className,
      )}
    >
      <Inbox className="size-8 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
