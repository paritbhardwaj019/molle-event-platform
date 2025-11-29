"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import { getHostBookings } from "@/lib/actions/booking";
import { formatPrice } from "@/lib/utils";
import { BookingTicketsModal } from "./booking-tickets-modal";
import { Eye, Ticket } from "lucide-react";

interface Booking {
  id: string;
  transactionId: string;
  amount: number;
  adminCut: number;
  paidAt: Date;
  ticketCount: number;
  customer: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  event: {
    id: string;
    title: string;
    slug: string;
  };
  referredBy: {
    name: string;
    code: string;
  } | null;
}

interface BookingsTableProps {
  showAdminCut?: boolean;
}

export function BookingsTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const result = await getHostBookings();
        if (result.success && result.data) {
          setBookings(result.data);
        } else {
          toast.error(result.error || "Failed to fetch bookings");
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
        toast.error("An error occurred while fetching bookings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleViewTickets = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBookingId(null);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Customer</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead>Paid When</TableHead>
              <TableHead>Referred By</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-24" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Customer</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead>Paid When</TableHead>
              <TableHead>Referred By</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={booking.customer.avatar || undefined} />
                      <AvatarFallback className="bg-gray-200 text-gray-600">
                        {booking.customer.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{booking.customer.name}</p>
                      <p className="text-sm text-gray-500">
                        {booking.customer.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/events/${booking.event.slug}`}
                    className="text-primary hover:underline"
                  >
                    {booking.event.title}
                  </Link>
                </TableCell>
                <TableCell>
                  {booking.amount === 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        FREE
                      </span>
                      <span className="text-gray-500 text-sm">₹0.00</span>
                    </div>
                  ) : (
                    <span className="font-medium">
                      {formatPrice(booking.amount)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-medium">
                    <Ticket className="h-3 w-3 mr-1" />
                    {booking.ticketCount}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(new Date(booking.paidAt), "MMM d, yyyy HH:mm")}
                </TableCell>
                <TableCell>
                  {booking.referredBy ? (
                    <div>
                      <p className="font-medium">{booking.referredBy.name}</p>
                      <p className="text-sm text-gray-500">
                        {booking.referredBy.code}
                      </p>
                    </div>
                  ) : (
                    <span className="text-gray-500">Direct</span>
                  )}
                </TableCell>
                <TableCell>
                  {booking.amount === 0 ? (
                    <span className="text-sm text-gray-500 italic">
                      No transaction required
                    </span>
                  ) : (
                    <span className="font-mono text-sm text-gray-600">
                      {booking.transactionId}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTickets(booking.id)}
                    className="gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View Tickets
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BookingTicketsModal
        bookingId={selectedBookingId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
