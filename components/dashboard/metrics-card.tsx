import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isCurrency?: boolean;
}

export function MetricsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  isCurrency,
}: MetricsCardProps) {
  const formattedValue = isCurrency
    ? `₹${typeof value === "number" ? value.toLocaleString("en-IN") : value}`
    : value;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
            {trend && (
              <span
                className={trend.isPositive ? "text-green-500" : "text-red-500"}
              >
                {trend.isPositive ? "+" : "-"}
                {trend.value}%
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
