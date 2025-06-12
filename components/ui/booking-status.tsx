import { type BookingStatus as BookingStatusType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { CheckCircle, Clock, XCircle, Check } from "lucide-react";

const statusConfig: Record<
  BookingStatusType,
  {
    label: string;
    color: string;
    icon: typeof CheckCircle;
  }
> = {
  CONFIRMED: {
    label: "Confirmed",
    color: "text-green-700 bg-green-50 border-green-200",
    icon: CheckCircle,
  },
  PENDING: {
    label: "Pending",
    color: "text-yellow-700 bg-yellow-50 border-yellow-200",
    icon: Clock,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-red-700 bg-red-50 border-red-200",
    icon: XCircle,
  },
  COMPLETED: {
    label: "Completed",
    color: "text-blue-700 bg-blue-50 border-blue-200",
    icon: Check,
  },
};

interface BookingStatusProps {
  status: BookingStatusType;
  className?: string;
}

export function BookingStatus({ status, className }: BookingStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium",
        config.color,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </div>
  );
}
