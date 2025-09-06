"use client";

import { EventStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { getEventStatusMessage, getEventStatusClass } from "@/lib/event-status";
import { cn } from "@/lib/utils";

interface EventStatusBadgeProps {
  status: EventStatus;
  className?: string;
  showIcon?: boolean;
}

export function EventStatusBadge({
  status,
  className,
  showIcon = false,
}: EventStatusBadgeProps) {
  const statusMessage = getEventStatusMessage(status);
  const statusClass = getEventStatusClass(status);

  const getStatusIcon = () => {
    switch (status) {
      case EventStatus.DRAFT:
        return "📝";
      case EventStatus.PUBLISHED:
        return "✅";
      case EventStatus.CANCELLED:
        return "❌";
      case EventStatus.COMPLETED:
        return "🏁";
      case EventStatus.EXPIRED:
        return "⏰";
      case EventStatus.FULL_HOUSE:
        return "🎫";
      default:
        return "";
    }
  };

  return (
    <Badge
      variant="secondary"
      className={cn(statusClass, "font-medium text-xs px-2 py-1", className)}
    >
      {showIcon && <span className="mr-1">{getStatusIcon()}</span>}
      {statusMessage}
    </Badge>
  );
}

interface EventStatusWithLogicProps {
  event: {
    id: string;
    status: EventStatus;
    startDate: Date;
    endDate: Date;
    maxTickets: number;
    soldTickets: number;
  };
  className?: string;
  showIcon?: boolean;
  useCalculatedStatus?: boolean;
}

export function EventStatusWithLogic({
  event,
  className,
  showIcon = false,
  useCalculatedStatus = true,
}: EventStatusWithLogicProps) {
  const { calculateEventStatus } = require("@/lib/event-status");

  const displayStatus = useCalculatedStatus
    ? calculateEventStatus(event)
    : event.status;

  return (
    <EventStatusBadge
      status={displayStatus}
      className={className}
      showIcon={showIcon}
    />
  );
}
