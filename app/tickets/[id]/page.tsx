import { getTicketById } from "@/lib/actions/ticket";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { QRCodeSVG } from "qrcode.react";
import {
  Calendar,
  MapPin,
  User,
  Phone,
  Hash,
  Package,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TicketStatus } from "@/components/ui/ticket-status";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { TicketDownloadWrapper } from "@/components/ticket-download-wrapper";

interface TicketPageProps {
  params: {
    id: string;
  };
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { data: ticket, error } = await getTicketById(params.id);

  if (error || !ticket) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Ticket Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with Event Image */}
          <div className="relative h-48 bg-gradient-to-r from-purple-600 to-pink-600">
            <Image
              src={ticket.event.coverImage}
              alt={ticket.event.title}
              fill
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <h1 className="text-2xl font-bold text-white mb-2">
                {ticket.event.title}
              </h1>
              <div className="flex items-center gap-4 text-white/90 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatInTimeZone(
                    ticket.event.startDate instanceof Date
                      ? ticket.event.startDate
                      : new Date(ticket.event.startDate),
                    "Asia/Kolkata",
                    "PPP"
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {ticket.event.location}
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Content */}
          <div className="p-6">
            {/* Status Badge */}
            <div className="flex justify-between items-center mb-6">
              <TicketStatus
                status={ticket.status as "ACTIVE" | "VERIFIED" | "CANCELLED"}
              />
              <div className="text-right">
                <p className="text-sm text-gray-500">Ticket #</p>
                <p className="font-mono text-sm font-medium">
                  {ticket.ticketNumber}
                </p>
              </div>
            </div>

            {/* Ticket Holder Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Ticket Holder Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="font-medium">{ticket.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Hash className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Age</p>
                        <p className="font-medium">{ticket.age} years</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{ticket.phoneNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Package</p>
                      <p className="font-medium">{ticket.package.name}</p>
                      {ticket.package.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {ticket.package.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm">
                  <QRCodeSVG
                    value={ticket.qrCode}
                    size={160}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Show this QR code to the host for verification
                </p>
              </div>
            </div>

            {/* Event Details */}
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Event Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Host</p>
                  <p className="font-medium">{ticket.event.organizerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ticket Price</p>
                  <p className="font-medium text-lg text-purple-600">
                    ₹{Number(ticket.ticketPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Event Time</p>
                  <p className="font-medium">
                    {formatInTimeZone(
                      ticket.event.startDate instanceof Date
                        ? ticket.event.startDate
                        : new Date(ticket.event.startDate),
                      "Asia/Kolkata",
                      "PPP 'at' p"
                    )}
                  </p>
                  {ticket.event.endDate && (
                    <p className="text-sm text-gray-600">
                      Ends:{" "}
                      {formatInTimeZone(
                        ticket.event.endDate instanceof Date
                          ? ticket.event.endDate
                          : new Date(ticket.event.endDate),
                        "Asia/Kolkata",
                        "PPP 'at' p"
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Booking Reference</p>
                  <p className="font-mono text-sm">
                    {ticket.booking.bookingNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Venue Address */}
            <div className="border-t border-gray-100 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Venue Address
              </h3>
              <div className="space-y-2">
                {ticket.event.streetAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {ticket.event.streetAddress}
                      </p>
                      {ticket.event.city && (
                        <p className="text-sm text-gray-600">
                          {ticket.event.city}
                        </p>
                      )}
                      {ticket.event.landmark && (
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="font-medium">Landmark:</span>{" "}
                          {ticket.event.landmark}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!ticket.event.streetAddress && ticket.event.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <p className="font-medium text-gray-900">
                      {ticket.event.location}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Package Benefits */}
            {ticket.package.benefits && ticket.package.benefits.length > 0 && (
              <div className="border-t border-gray-100 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Package Benefits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ticket.package.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Status */}
            {ticket.status === "VERIFIED" && ticket.verifiedAt && (
              <div className="border-t border-gray-100 pt-6 mt-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    ✓ Ticket Verified
                  </h3>
                  <p className="text-sm text-green-700">
                    This ticket was verified on{" "}
                    {format(new Date(ticket.verifiedAt), "PPP 'at' p")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Decorative Bottom Border */}
          <div className="h-2 bg-gradient-to-r from-purple-600 to-pink-600" />
        </div>

        {/* Print Instructions and Download Button */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <TicketDownloadWrapper
            ticketId={params.id}
            eventTitle={ticket.event.title}
          />
          <p className="text-sm text-gray-500">
            Save this page or download the PDF for easy access to your ticket
          </p>
        </div>
      </div>
    </div>
  );
}
