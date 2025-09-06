import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        tickets: true,
        event: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: booking.id,
        status: booking.status,
        bookingNumber: booking.bookingNumber,
        totalAmount: booking.totalAmount,
        ticketCount: booking.ticketCount,
        paymentStatus: booking.payment?.status || "PENDING",
        ticketsCount: booking.tickets.length,
        event: booking.event,
        createdAt: booking.payment?.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching booking status:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking status" },
      { status: 500 }
    );
  }
}
