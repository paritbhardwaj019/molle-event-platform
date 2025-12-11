"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  BookingStatus,
  Prisma,
  PaymentStatus,
  TicketStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { startOfDay } from "date-fns";

export type Booking = {
  id: string;
  eventId: string;
  userId: string;
  packageId: string;
  status: BookingStatus;
  slotDate: Date;
  createdAt: Date;
  updatedAt: Date;
  event: {
    title: string;
    slug: string;
  };
  package: {
    name: string;
    price: number;
  };
};

export async function getUserBookings() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view bookings",
      };
    }

    const bookings = await db.booking.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        event: {
          select: {
            title: true,
            slug: true,
          },
        },
        package: {
          select: {
            name: true,
            price: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc" as Prisma.SortOrder,
      },
    });

    const formattedBookings: Booking[] = bookings.map((booking) => ({
      id: booking.id,
      eventId: booking.eventId,
      userId: booking.userId,
      packageId: booking.packageId,
      status: booking.status,
      slotDate: new Date(booking.updatedAt),
      createdAt: new Date(booking.updatedAt),
      updatedAt: new Date(booking.updatedAt),
      event: booking.event,
      package: {
        name: booking.package.name,
        price: Number(booking.package.price),
      },
    }));

    return {
      success: true,
      data: formattedBookings,
    };
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return {
      success: false,
      error: "Failed to fetch bookings",
    };
  }
}

export async function cancelBooking(bookingId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to cancel a booking",
      };
    }

    // Check if the booking exists and belongs to the user
    const booking = await db.booking.findFirst({
      where: {
        id: bookingId,
        userId: session.user.id,
      },
    });

    if (!booking) {
      return {
        success: false,
        error: "Booking not found or you don't have permission to cancel it",
      };
    }

    // Update the booking status
    await db.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    // Revalidate the bookings page
    revalidatePath("/bookings");

    return { success: true };
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return {
      success: false,
      error: "Failed to cancel booking",
    };
  }
}

export async function getFeaturedEvents() {
  try {
    const featuredEvents = await db.event.findMany({
      where: {
        status: "PUBLISHED",
        isFeatured: true,
        endDate: {
          gt: new Date(), // Only show events that haven't ended
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        startDate: true,
        endDate: true,
        organizerName: true,
        maxTickets: true,
        soldTickets: true,
        location: true,
        packages: {
          orderBy: {
            price: "asc",
          },
          take: 1,
          select: {
            price: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return {
      success: true,
      data: featuredEvents.map((event) => ({
        id: event.id,
        title: event.title,
        slug: event.slug,
        subtitle: event.description,
        coverImage: event.coverImage,
        date: format(event.startDate, "dd/MM/yyyy"),
        time: format(event.startDate, "h:mm a"),
        location: event.location,
        organizerName: event.organizerName,
        maxTickets: event.maxTickets,
        soldTickets: event.soldTickets,
        price: Number(event.packages[0]?.price || 0),
        tags: ["FEATURED"],
      })),
    };
  } catch (error) {
    console.error("Error fetching featured events:", error);
    return {
      success: false,
      error: "Failed to fetch featured events",
    };
  }
}

export async function getHostBookings(eventId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view bookings",
      };
    }

    // Check if user is HOST or ADMIN
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "HOST" && user.role !== "ADMIN")) {
      return {
        success: false,
        error: "You don't have permission to view these bookings",
      };
    }

    // Get platform fee percentage
    const platformSettingResult = await db.platformSetting.findUnique({
      where: { key: "platform_fee_percentage" },
    });

    const platformFeePercentage = platformSettingResult
      ? Number(platformSettingResult.value)
      : 10; // Default 10% if not set

    const bookings = await db.booking.findMany({
      where: {
        event: {
          hostId: user.role === "HOST" ? session.user.id : undefined,
          id: eventId,
        },
        status: "CONFIRMED",
        OR: [
          {
            payment: {
              status: "COMPLETED",
            },
          },
          {
            totalAmount: 0, // Include free bookings
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        event: {
          select: {
            title: true,
            slug: true,
            enableReferrers: true,
          },
        },
        payment: {
          select: {
            cashfreePaymentId: true,
            amount: true,
            createdAt: true,
          },
        },
        referralLink: {
          select: {
            referrer: {
              select: {
                id: true,
                name: true,
              },
            },
            referralCode: true,
          },
        },
      },
      orderBy: {
        bookedAt: "desc",
      },
    });

    const formattedBookings = bookings.map((booking) => {
      const amount = Number(
        booking.payment?.amount || booking.totalAmount || 0
      );
      const adminCut = amount > 0 ? (amount * platformFeePercentage) / 100 : 0;

      return {
        id: booking.id,
        transactionId:
          booking.payment?.cashfreePaymentId || (amount === 0 ? "FREE" : ""),
        amount,
        adminCut,
        paidAt: booking.payment?.createdAt || booking.bookedAt,
        ticketCount: booking.ticketCount,
        customer: {
          id: booking.user.id,
          name: booking.user.name,
          email: booking.user.email,
          avatar: booking.user.avatar,
        },
        event: {
          id: booking.eventId,
          title: booking.event.title,
          slug: booking.event.slug,
          enableReferrers: booking.event.enableReferrers,
        },
        referredBy: booking.referralLink
          ? {
              id: booking.referralLink.referrer.id,
              name: booking.referralLink.referrer.name,
              code: booking.referralLink.referralCode,
            }
          : null,
      };
    });

    return {
      success: true,
      data: formattedBookings,
    };
  } catch (error) {
    console.error("Error fetching host bookings:", error);
    return {
      success: false,
      error: "Failed to fetch bookings",
    };
  }
}

export async function getBookingStats() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view booking stats",
      };
    }

    // Check if user is HOST or ADMIN
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "HOST" && user.role !== "ADMIN")) {
      return {
        success: false,
        error: "You don't have permission to view these stats",
      };
    }

    // Get total revenue and bookings
    const totalStats = await db.booking.aggregate({
      where: {
        event: {
          hostId: user.role === "HOST" ? session.user.id : undefined,
        },
        status: "CONFIRMED",
        OR: [
          {
            payment: {
              status: "COMPLETED",
            },
          },
          {
            totalAmount: 0, // Include free bookings
          },
        ],
      },
      _sum: {
        totalAmount: true,
      },
      _count: true,
    });

    // Get today's revenue
    const today = startOfDay(new Date());
    const todayStats = await db.booking.aggregate({
      where: {
        event: {
          hostId: user.role === "HOST" ? session.user.id : undefined,
        },
        status: "CONFIRMED",
        OR: [
          {
            payment: {
              status: "COMPLETED",
              createdAt: {
                gte: today,
              },
            },
          },
          {
            totalAmount: 0, // Include free bookings
            bookedAt: {
              gte: today,
            },
          },
        ],
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get total events count for host
    const eventsCount =
      user.role === "HOST"
        ? await db.event.count({
            where: {
              hostId: session.user.id,
            },
          })
        : await db.event.count();

    // Get total referrers count for host
    const referrersCount =
      user.role === "HOST"
        ? await db.user.count({
            where: {
              referredByHostId: session.user.id,
              role: "REFERRER",
            },
          })
        : await db.user.count({
            where: {
              role: "REFERRER",
            },
          });

    return {
      success: true,
      data: {
        totalRevenue: Number(totalStats._sum.totalAmount || 0),
        todayRevenue: Number(todayStats._sum.totalAmount || 0),
        totalBookings: totalStats._count || 0,
        eventsCount,
        referrersCount,
      },
    };
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    return {
      success: false,
      error: "Failed to fetch booking stats",
    };
  }
}

export async function getBookingTickets(bookingId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view tickets",
      };
    }

    // First, get the booking to check access permissions
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: {
          select: {
            hostId: true,
            title: true,
          },
        },
      },
    });

    if (!booking) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    // Check if user is the event host, admin, or the booking owner
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    const isHost = booking.event.hostId === session.user.id;
    const isAdmin = user?.role === "ADMIN";
    const isBookingOwner = booking.userId === session.user.id;

    if (!isHost && !isAdmin && !isBookingOwner) {
      return {
        success: false,
        error: "You don't have permission to view these tickets",
      };
    }

    // Fetch tickets for this booking
    const tickets = await db.ticket.findMany({
      where: {
        bookingId: bookingId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        package: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return {
      success: true,
      data: {
        bookingNumber: booking.bookingNumber,
        eventTitle: booking.event.title,
        tickets: tickets.map((ticket) => ({
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          fullName: ticket.fullName,
          age: ticket.age,
          phoneNumber: ticket.phoneNumber,
          status: ticket.status,
          ticketPrice: Number(ticket.ticketPrice),
          verifiedAt: ticket.verifiedAt,
          packageName: ticket.package.name,
          user: {
            id: ticket.user.id,
            name: ticket.user.name,
            email: ticket.user.email,
            avatar: ticket.user.avatar,
          },
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching booking tickets:", error);
    return {
      success: false,
      error: "Failed to fetch tickets",
    };
  }
}

export async function createFreeBooking(data: {
  eventId: string;
  packageSelections: Array<{
    packageId: string;
    quantity: number;
    ticketHolders: Array<{
      fullName: string;
      age: number;
      phoneNumber: string;
    }>;
  }>;
  referralCode?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to book tickets",
      };
    }

    // Validate event exists and is published
    const event = await db.event.findUnique({
      where: { id: data.eventId },
      include: {
        packages: true,
      },
    });

    if (!event) {
      return {
        success: false,
        error: "Event not found",
      };
    }

    if (event.status !== "PUBLISHED") {
      return {
        success: false,
        error: "Event is not available for booking",
      };
    }

    // Validate all packages are free
    const packageIds = data.packageSelections.map((s) => s.packageId);
    const packages = event.packages.filter((p) => packageIds.includes(p.id));

    const hasNonFreePackage = packages.some((p) => Number(p.price) > 0);
    if (hasNonFreePackage) {
      return {
        success: false,
        error:
          "This booking contains paid tickets. Please use the payment flow.",
      };
    }

    // Calculate total tickets
    const totalTickets = data.packageSelections.reduce(
      (sum, s) => sum + s.quantity,
      0
    );

    // Check availability
    const currentSoldTickets = event.soldTickets || 0;
    if (currentSoldTickets + totalTickets > event.maxTickets) {
      return {
        success: false,
        error: "Not enough tickets available",
      };
    }

    // Generate booking number
    const bookingNumber = `BK${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Handle referral code if provided
    let referralLink = null;
    if (data.referralCode) {
      referralLink = await db.referralLink.findFirst({
        where: {
          referralCode: data.referralCode,
          eventId: data.eventId,
        },
      });
    }

    // Create booking with tickets in a transaction
    const booking = await db.$transaction(async (tx) => {
      // Create the booking
      const newBooking = await tx.booking.create({
        data: {
          userId: session.user.id,
          eventId: data.eventId,
          packageId: data.packageSelections[0].packageId,
          status: "CONFIRMED",
          bookingNumber,
          ticketCount: totalTickets,
          totalAmount: 0,
          bookedAt: new Date(),
          referralLinkId: referralLink?.id,
        },
      });

      // Create tickets for each package selection
      const ticketsToCreate = [];
      for (const selection of data.packageSelections) {
        const pkg = packages.find((p) => p.id === selection.packageId);
        if (!pkg) continue;

        for (const holder of selection.ticketHolders) {
          const ticketNumber = `TKT${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          ticketsToCreate.push({
            userId: session.user.id,
            eventId: data.eventId,
            packageId: selection.packageId,
            bookingId: newBooking.id,
            ticketNumber,
            qrCode: ticketNumber, // Use ticket number as QR code for now
            fullName: holder.fullName,
            age: holder.age,
            phoneNumber: holder.phoneNumber,
            status: TicketStatus.ACTIVE,
            ticketPrice: 0,
          });
        }
      }

      await tx.ticket.createMany({
        data: ticketsToCreate,
      });

      // Update event sold tickets count
      await tx.event.update({
        where: { id: data.eventId },
        data: {
          soldTickets: {
            increment: totalTickets,
          },
        },
      });

      return newBooking;
    });

    revalidatePath("/bookings");
    revalidatePath(`/events/${event.slug}`);

    return {
      success: true,
      data: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
      },
    };
  } catch (error) {
    console.error("Error creating free booking:", error);
    return {
      success: false,
      error: "Failed to create booking",
    };
  }
}
