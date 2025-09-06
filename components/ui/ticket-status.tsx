import { Badge } from "@/components/ui/badge";

export type TicketStatus = "ACTIVE" | "VERIFIED" | "CANCELLED";

interface TicketStatusProps {
  status: TicketStatus;
}

export function TicketStatus({ status }: TicketStatusProps) {
  const getStatusConfig = (status: TicketStatus) => {
    switch (status) {
      case "ACTIVE":
        return {
          label: "Active",
          variant: "default" as const,
          className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
        };
      case "VERIFIED":
        return {
          label: "Verified",
          variant: "default" as const,
          className: "bg-green-100 text-green-800 hover:bg-green-100",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 hover:bg-red-100",
        };
      default:
        return {
          label: status,
          variant: "secondary" as const,
          className: "",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
