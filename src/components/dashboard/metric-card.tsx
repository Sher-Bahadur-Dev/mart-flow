import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: number | string | null;
  hint?: string;
};

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value === null ? "—" : value}</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {hint ?? (value === null ? "Totals appear from live store records." : "From live store records.")}
      </CardContent>
    </Card>
  );
}
