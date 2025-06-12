"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { BookingStatus, Event, UserRole, UserStatus } from "@prisma/client";

type EventWithBookings = {
  id: string;
  startDate: Date;
  bookings: {
    totalAmount: string;
  }[];
};

export type Host = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  lastEventDate: Date | null;
  referrersCount: number;
  events?: Event[];
};

export type Referrer = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  hostId: string | null;
  hostName: string | null;
  totalReferrals: number;
  totalCommission: number;
};

export async function getAllHosts() {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        data: [],
        error: "Unauthorized: Admin access required",
      };
    }

    const hosts = await db.user.findMany({
      where: {
        role: UserRole.HOST,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        hostedEvents: {
          select: {
            id: true,
            startDate: true,
            bookings: {
              select: {
                totalAmount: true,
              },
            },
          },
        },
        hostReferrers: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedHosts: Host[] = hosts.map((host) => {
      const totalEvents = host.hostedEvents.length;
      const totalBookings = host.hostedEvents.reduce(
        (sum: number, event) => sum + event.bookings.length,
        0
      );
      const totalRevenue = host.hostedEvents.reduce(
        (sum: number, event) =>
          sum +
          event.bookings.reduce(
            (eventSum: number, booking) =>
              eventSum + Number(booking.totalAmount),
            0
          ),
        0
      );
      const lastEventDate =
        host.hostedEvents.length > 0
          ? host.hostedEvents.reduce(
              (latest: Date, event) =>
                latest > event.startDate ? latest : event.startDate,
              host.hostedEvents[0].startDate
            )
          : null;

      return {
        id: host.id,
        name: host.name,
        email: host.email,
        status: host.status,
        createdAt: host.createdAt,
        totalEvents,
        totalBookings,
        totalRevenue,
        lastEventDate,
        referrersCount: host.hostReferrers.length,
      };
    });

    return { success: true, data: formattedHosts };
  } catch (error) {
    console.error("Error fetching hosts:", error);
    return { error: "Failed to fetch hosts" };
  }
}

export async function getHostById(id: string) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    const host = await db.user.findUnique({
      where: {
        id,
        role: UserRole.HOST,
      },
      include: {
        hostedEvents: {
          include: {
            bookings: {
              include: {
                payment: true,
              },
            },
          },
        },
        hostReferrers: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!host) {
      return { error: "Host not found" };
    }

    return { success: true, data: host };
  } catch (error) {
    console.error("Error fetching host:", error);
    return { error: "Failed to fetch host details" };
  }
}

export async function blockHost(id: string) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    await db.user.update({
      where: {
        id,
        role: UserRole.HOST,
      },
      data: {
        status: UserStatus.INACTIVE,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error blocking host:", error);
    return { error: "Failed to block host" };
  }
}

export async function unblockHost(id: string) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    await db.user.update({
      where: {
        id,
        role: UserRole.HOST,
      },
      data: {
        status: UserStatus.ACTIVE,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error unblocking host:", error);
    return { error: "Failed to unblock host" };
  }
}

export async function getAllReferrers() {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return {
        success: false,
        data: [],
        error: "Unauthorized: Admin access required",
      };
    }

    const referrers = await db.user.findMany({
      where: {
        role: UserRole.REFERRER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        referrerHost: {
          select: {
            id: true,
            name: true,
          },
        },
        referrals: {
          select: {
            id: true,
            commission: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedReferrers: Referrer[] = referrers.map((referrer) => {
      const totalReferrals = referrer.referrals ? referrer.referrals.length : 0;
      const totalCommission = referrer.referrals
        ? referrer.referrals.reduce(
            (sum, referral) => sum + Number(referral.commission),
            0
          )
        : 0;

      return {
        id: referrer.id,
        name: referrer.name,
        email: referrer.email,
        status: referrer.status,
        createdAt: referrer.createdAt,
        hostId: referrer.referrerHost?.id || null,
        hostName: referrer.referrerHost?.name || null,
        totalReferrals,
        totalCommission,
      };
    });

    return { success: true, data: formattedReferrers };
  } catch (error) {
    console.error("Error fetching referrers:", error);
    return { error: "Failed to fetch referrers" };
  }
}

export async function getHostEvents() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to view events" };
    }

    // Check if user is HOST
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.HOST) {
      return {
        success: false,
        error: "Only hosts can view their events",
      };
    }

    const events = await db.event.findMany({
      where: {
        hostId: session.user.id,
      },
      include: {
        packages: true,
        bookings: {
          where: {
            status: "CONFIRMED",
          },
          include: {
            payment: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: events };
  } catch (error) {
    console.error("Error fetching host events:", error);
    return { error: "Failed to fetch events" };
  }
}
