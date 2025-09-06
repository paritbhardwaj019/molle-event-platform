import { getUserTickets, type Ticket } from "@/lib/actions/ticket";
import { TicketStatus } from "@/components/ui/ticket-status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  CalendarDays,
  Package,
  Eye,
  Ticket as TicketIcon,
  Download,
} from "lucide-react";
import Link from "next/link";
import { TicketDownloadWrapper } from "@/components/ticket-download-wrapper";

export default async function BookingsPage() {
  const { data: tickets, error } = (await getUserTickets()) as {
    data: Ticket[] | undefined;
    error: string | undefined;
  };

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  if (!tickets?.length) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2">
        <TicketIcon className="h-8 w-8 text-gray-400" />
        <h3 className="font-medium text-gray-900">No tickets yet</h3>
        <p className="text-sm text-gray-600">
          Your event tickets will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-10">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Your Tickets</h3>
        <p className="text-sm text-gray-600">
          Manage and view your event tickets.
        </p>
      </div>

      <div className="rounded-lg border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Ticket Holder</TableHead>
              <TableHead>EVENT START Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-medium text-gray-900">
                  {ticket.event.title}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span>{ticket.package.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{ticket.fullName}</p>
                    <p className="text-sm text-gray-500">Age: {ticket.age}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(ticket.event.startDate), "PPP")}
                </TableCell>
                <TableCell>
                  <TicketStatus
                    status={
                      ticket.status as "ACTIVE" | "VERIFIED" | "CANCELLED"
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">
                  ₹{ticket.ticketPrice}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link href={`/tickets/${ticket.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <TicketDownloadWrapper
                      ticketId={ticket.id}
                      eventTitle={ticket.event.title}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
