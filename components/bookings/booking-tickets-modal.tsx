"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getBookingTickets } from "@/lib/actions/booking";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Circle } from "lucide-react";

interface BookingTicket {
  id: string;
  ticketNumber: string;
  fullName: string;
  age: number;
  phoneNumber: string;
  status: string;
  ticketPrice: number;
  verifiedAt: Date | null;
  packageName: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface BookingTicketsModalProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingTicketsModal({
  bookingId,
  isOpen,
  onClose,
}: BookingTicketsModalProps) {
  const [tickets, setTickets] = useState<BookingTicket[]>([]);
  const [bookingNumber, setBookingNumber] = useState<string>("");
  const [eventTitle, setEventTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && bookingId) {
      fetchTickets();
    } else {
      // Reset state when modal closes
      setTickets([]);
      setBookingNumber("");
      setEventTitle("");
    }
  }, [isOpen, bookingId]);

  const fetchTickets = async () => {
    if (!bookingId) return;

    setIsLoading(true);
    try {
      const result = await getBookingTickets(bookingId);
      if (result.success && result.data) {
        setTickets(result.data.tickets);
        setBookingNumber(result.data.bookingNumber);
        setEventTitle(result.data.eventTitle);
      } else {
        toast.error(result.error || "Failed to fetch tickets");
        onClose();
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      toast.error("An error occurred while fetching tickets");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Circle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Booking Tickets</DialogTitle>
          <DialogDescription>
            {eventTitle && (
              <div className="space-y-1 mt-2">
                <p className="text-sm font-medium text-gray-900">
                  Event: {eventTitle}
                </p>
                <p className="text-sm text-gray-600">
                  Booking #{bookingNumber}
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 border rounded-lg"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : tickets.length > 0 ? (
          <div className="rounded-lg border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Holder Name</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Buyer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">
                      {ticket.ticketNumber}
                    </TableCell>
                    <TableCell className="font-medium">
                      {ticket.fullName}
                    </TableCell>
                    <TableCell>{ticket.age}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {ticket.phoneNumber}
                    </TableCell>
                    <TableCell>{ticket.packageName}</TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(ticket.ticketPrice)}
                    </TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ticket.user.avatar || undefined} />
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                            {ticket.user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {ticket.user.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {ticket.user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-gray-500">
            No tickets found for this booking.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
