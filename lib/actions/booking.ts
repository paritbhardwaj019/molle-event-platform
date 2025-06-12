"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { BookingStatus, Prisma, PaymentStatus } from "@prisma/client";
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
      },
      select: {
        id: true,
        title: true,
        description: true,
        coverImage: true,
        startDate: true,
        endDate: true,
        organizerName: true,
        maxTickets: true,
        soldTickets: true,

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
        subtitle: event.description,
        coverImage: event.coverImage,
        date: format(event.startDate, "dd/MM/yyyy"),
        time: format(event.startDate, "h:mm a"),
        location: "TBA",
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

export async function getHostBookings() {
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

    const bookings = await db.booking.findMany({
      where: {
        event: {
          hostId: user.role === "HOST" ? session.user.id : undefined,
        },
        status: "CONFIRMED",
        payment: {
          status: "COMPLETED",
        },
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
          },
        },
        payment: {
          select: {
            razorpayPaymentId: true,
            amount: true,
            createdAt: true,
          },
        },
        referralLink: {
          select: {
            referrer: {
              select: {
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

    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      transactionId: booking.payment?.razorpayPaymentId || "",
      amount: Number(booking.payment?.amount || 0),
      paidAt: booking.payment?.createdAt || booking.bookedAt,
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
      },
      referredBy: booking.referralLink
        ? {
            name: booking.referralLink.referrer.name,
            code: booking.referralLink.referralCode,
          }
        : null,
    }));

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
        payment: {
          status: "COMPLETED",
        },
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
        payment: {
          status: "COMPLETED",
          createdAt: {
            gte: today,
          },
        },
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
