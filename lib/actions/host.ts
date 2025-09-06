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
  hostFeePercentage: number | null;
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
        hostFeePercentage: true,
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
        hostFeePercentage: host.hostFeePercentage
          ? Number(host.hostFeePercentage)
          : null,
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

export async function updateHostFeePercentage(
  id: string,
  feePercentage: number | null
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== UserRole.ADMIN) {
      return { success: false, error: "Unauthorized: Admin access required" };
    }

    // Validate percentage is between 0 and 100 if provided
    if (feePercentage !== null && (feePercentage < 0 || feePercentage > 100)) {
      return {
        success: false,
        error: "Fee percentage must be between 0 and 100",
      };
    }

    await db.user.update({
      where: {
        id,
        role: UserRole.HOST,
      },
      data: {
        hostFeePercentage: feePercentage,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating host fee percentage:", error);
    return { error: "Failed to update host fee percentage" };
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

export async function getHostDashboardMetrics() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in to view metrics" };
    }

    // Check if user is HOST
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.HOST) {
      return {
        success: false,
        error: "Only hosts can view their metrics",
      };
    }

    // Get host's events with bookings and referrals
    const events = await db.event.findMany({
      where: {
        hostId: session.user.id,
      },
      include: {
        bookings: {
          where: {
            status: BookingStatus.CONFIRMED,
          },
        },
        referralLinks: {
          include: {
            bookings: {
              where: {
                status: BookingStatus.CONFIRMED,
              },
            },
          },
        },
        inviteRequests: {
          where: {
            status: "PENDING",
          },
        },
      },
    });

    // Calculate metrics
    const totalEvents = events.length;
    const totalBookings = events.reduce(
      (sum, event) => sum + event.bookings.length,
      0
    );
    const totalRevenue = events.reduce(
      (sum, event) =>
        sum +
        event.bookings.reduce(
          (eventSum, booking) => eventSum + Number(booking.totalAmount),
          0
        ),
      0
    );

    // Calculate total referrals (bookings made through referral links)
    const totalReferrals = events.reduce(
      (sum, event) =>
        sum +
        event.referralLinks.reduce(
          (linkSum, link) => linkSum + link.bookings.length,
          0
        ),
      0
    );

    const pendingInvites = events.reduce(
      (sum, event) => sum + event.inviteRequests.length,
      0
    );

    // Calculate revenue growth (comparing last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentRevenue = events.reduce(
      (sum, event) =>
        sum +
        event.bookings
          .filter((booking) => booking.bookedAt >= thirtyDaysAgo)
          .reduce(
            (eventSum, booking) => eventSum + Number(booking.totalAmount),
            0
          ),
      0
    );

    const previousRevenue = events.reduce(
      (sum, event) =>
        sum +
        event.bookings
          .filter(
            (booking) =>
              booking.bookedAt >= sixtyDaysAgo &&
              booking.bookedAt < thirtyDaysAgo
          )
          .reduce(
            (eventSum, booking) => eventSum + Number(booking.totalAmount),
            0
          ),
      0
    );

    const revenueGrowth =
      previousRevenue > 0
        ? ((recentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    return {
      success: true,
      data: {
        totalEvents,
        totalBookings,
        totalRevenue,
        totalReferrals,
        pendingInvites,
        revenueGrowth: revenueGrowth,
      },
    };
  } catch (error) {
    console.error("Error fetching host dashboard metrics:", error);
    return { success: false, error: "Failed to fetch dashboard metrics" };
  }
}

export async function getHostReferrals() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view referrals",
      };
    }

    // Check if user is HOST
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.HOST) {
      return {
        success: false,
        error: "Only hosts can view their referrals",
      };
    }

    // Get referrals made through this host's events
    const referrals = await db.booking.findMany({
      where: {
        event: {
          hostId: session.user.id,
        },
        referralLinkId: {
          not: null,
        },
        status: BookingStatus.CONFIRMED,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        referralLink: {
          include: {
            referrer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        bookedAt: "desc",
      },
    });

    const formattedReferrals = referrals.map((booking) => ({
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      amount: Number(booking.totalAmount),
      bookedAt: booking.bookedAt,
      customer: {
        id: booking.user.id,
        name: booking.user.name,
        email: booking.user.email,
      },
      event: {
        id: booking.event.id,
        title: booking.event.title,
        slug: booking.event.slug,
      },
      referrer: booking.referralLink?.referrer
        ? {
            id: booking.referralLink.referrer.id,
            name: booking.referralLink.referrer.name,
            email: booking.referralLink.referrer.email,
          }
        : null,
      referralCode: booking.referralCode,
    }));

    return { success: true, data: formattedReferrals };
  } catch (error) {
    console.error("Error fetching host referrals:", error);
    return { success: false, error: "Failed to fetch referrals" };
  }
}

// Host Profile Management
export async function getHostProfile() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
      },
    });

    if (!user || user.role !== UserRole.HOST) {
      return {
        success: false,
        error: "Only hosts can access profile settings",
      };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error("Error fetching host profile:", error);
    return { success: false, error: "Failed to fetch profile" };
  }
}

export async function updateHostProfile(data: {
  name: string;
  bio?: string;
  avatar?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.HOST) {
      return { success: false, error: "Only hosts can update profile" };
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        bio: data.bio,
        avatar: data.avatar,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
      },
    });

    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Error updating host profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

// Public Host Profile
export async function getPublicHostProfile(hostId: string) {
  try {
    console.log("hostId", hostId);
    const host = await db.user.findUnique({
      where: {
        id: hostId,
        role: UserRole.HOST,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        createdAt: true,
        hostedEvents: {
          where: {
            status: "PUBLISHED",
          },
          include: {
            packages: true,
            reviews: {
              include: {
                user: {
                  select: {
                    name: true,
                    avatar: true,
                  },
                },
              },
            },
            _count: {
              select: {
                reviews: true,
              },
            },
          },
          orderBy: {
            startDate: "desc",
          },
        },
      },
    });

    if (!host) {
      return { success: false, error: "Host not found" };
    }

    // Get all reviews from all events owned by this host
    const allReviews = await db.review.findMany({
      where: {
        event: {
          hostId: hostId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            avatar: true,
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

    // Calculate host statistics
    const totalEvents = host.hostedEvents.length;
    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, review) => sum + review.rating, 0) /
          allReviews.length
        : 0;

    return {
      success: true,
      data: {
        ...host,
        reviews: allReviews,
        stats: {
          totalEvents,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: allReviews.length,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching public host profile:", error);
    return { success: false, error: "Failed to fetch host profile" };
  }
}

// Host Reporting System
export async function reportHost(data: {
  hostId: string;
  reason: string;
  description?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to report a host",
      };
    }

    // Check if host exists and is active
    const host = await db.user.findUnique({
      where: {
        id: data.hostId,
        role: UserRole.HOST,
      },
    });

    if (!host) {
      return { success: false, error: "Host not found" };
    }

    // Check if user has already reported this host
    const existingReport = await db.hostReport.findUnique({
      where: {
        reportedHostId_reportingUserId: {
          reportedHostId: data.hostId,
          reportingUserId: session.user.id,
        },
      },
    });

    if (existingReport) {
      return { success: false, error: "You have already reported this host" };
    }

    const report = await db.hostReport.create({
      data: {
        reportedHostId: data.hostId,
        reportingUserId: session.user.id,
        reason: data.reason,
        description: data.description,
      },
    });

    return { success: true, data: report };
  } catch (error) {
    console.error("Error reporting host:", error);
    return { success: false, error: "Failed to report host" };
  }
}

// Admin Functions for Host Reports
export async function getAllHostReports() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return { success: false, error: "Admin access required" };
    }

    const reports = await db.hostReport.findMany({
      include: {
        reportedHost: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            status: true,
          },
        },
        reportingUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: reports };
  } catch (error) {
    console.error("Error fetching host reports:", error);
    return { success: false, error: "Failed to fetch host reports" };
  }
}

export async function updateHostReportStatus(
  reportId: string,
  status: "REVIEWED" | "RESOLVED" | "DISMISSED",
  adminNotes?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be logged in" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.ADMIN) {
      return { success: false, error: "Admin access required" };
    }

    const updatedReport = await db.hostReport.update({
      where: { id: reportId },
      data: {
        status,
        adminNotes,
      },
    });

    return { success: true, data: updatedReport };
  } catch (error) {
    console.error("Error updating host report:", error);
    return { success: false, error: "Failed to update report status" };
  }
}
