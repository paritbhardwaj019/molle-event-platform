import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all bookings for this user
    const bookings = await db.booking.findMany({
      where: { userId: user.id },
      include: {
        tickets: true,
        event: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get all tickets for this user (with booking status filter)
    const tickets = await db.ticket.findMany({
      where: {
        userId: user.id,
        booking: {
          status: {
            in: ["CONFIRMED", "COMPLETED"],
          },
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
          },
        },
        event: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      bookings: bookings.map((booking) => ({
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        ticketCount: booking.tickets.length,
        eventTitle: booking.event.title,
        eventSlug: booking.event.slug,
        createdAt: booking.bookedAt,
      })),
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        fullName: ticket.fullName,
        status: ticket.status,
        bookingId: ticket.booking.id,
        bookingNumber: ticket.booking.bookingNumber,
        bookingStatus: ticket.booking.status,
        eventTitle: ticket.event.title,
        eventSlug: ticket.event.slug,
        createdAt: ticket.createdAt,
      })),
    });
  } catch (error) {
    console.error("Debug user tickets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
