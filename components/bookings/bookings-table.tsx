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
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import { getHostBookings } from "@/lib/actions/booking";
import { formatPrice } from "@/lib/utils";

interface Booking {
  id: string;
  transactionId: string;
  amount: number;
  adminCut: number;
  paidAt: Date;
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

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Customer</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid When</TableHead>
              <TableHead>Referred By</TableHead>
              <TableHead>Transaction ID</TableHead>
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
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-gray-50">
            <TableHead>Customer</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid When</TableHead>
            <TableHead>Referred By</TableHead>
            <TableHead>Transaction ID</TableHead>
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
                <span className="font-medium">
                  {formatPrice(booking.amount)}
                </span>
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
                <span className="font-mono text-sm text-gray-600">
                  {booking.transactionId}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
