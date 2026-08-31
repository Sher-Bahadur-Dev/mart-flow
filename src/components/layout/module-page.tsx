import { EmptyState } from "@/components/ui/empty-state";

type ModulePageProps = {
  title: string;
  description: string;
};

export function ModulePage({ title, description }: ModulePageProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <EmptyState />
    </section>
  );
}
