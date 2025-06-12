import { getUserBookings, type Booking } from "@/lib/actions/booking";
import { BookingStatus } from "@/components/ui/booking-status";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { CalendarDays, Package } from "lucide-react";

export default async function BookingsPage() {
  const { data: bookings, error } = (await getUserBookings()) as {
    data: Booking[] | undefined;
    error: string | undefined;
  };

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  if (!bookings?.length) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-2">
        <CalendarDays className="h-8 w-8 text-gray-400" />
        <h3 className="font-medium text-gray-900">No bookings yet</h3>
        <p className="text-sm text-gray-600">
          Your event bookings will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-10">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Your Bookings</h3>
        <p className="text-sm text-gray-600">
          Manage and view your event bookings.
        </p>
      </div>

      <div className="rounded-lg border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium text-gray-900">
                  {booking.event.title}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span>{booking.package.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(booking.slotDate), "PPP")}
                </TableCell>
                <TableCell>
                  <BookingStatus status={booking.status} />
                </TableCell>
                <TableCell className="font-medium">
                  ₹{booking.package.price}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
