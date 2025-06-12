"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { UserRole, UserStatus, InviteStatus } from "@prisma/client";

export async function getHostMetrics() {
  const session = await auth();
  if (!session || session.user.role !== "HOST") {
    throw new Error("Unauthorized");
  }

  const startOfCurrentMonth = new Date(new Date().setDate(1));
  const startOfLastMonth = new Date(
    new Date().setMonth(new Date().getMonth() - 1, 1)
  );

  const [
    events,
    bookings,
    customers,
    referrers,
    invites,
    revenue,
    lastMonthRevenue,
    lastMonthCustomers,
  ] = await Promise.all([
    db.event.count({
      where: {
        status: { not: "CANCELLED" },
      },
    }),
    db.booking.count({
      where: {
        status: { not: "CANCELLED" },
      },
    }),
    db.user.count({
      where: {
        role: "USER",
        status: "ACTIVE",
        bookings: {
          some: {
            status: { not: "CANCELLED" },
          },
        },
      },
    }),
    db.user.count({
      where: {
        role: "REFERRER",
        status: "ACTIVE",
      },
    }),
    db.inviteRequest.count({
      where: {
        status: "PENDING",
        event: {
          status: { not: "CANCELLED" },
        },
      },
    }),
    db.booking.aggregate({
      where: {
        status: "COMPLETED",
        updatedAt: {
          gte: startOfCurrentMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    db.booking.aggregate({
      where: {
        status: "COMPLETED",
        updatedAt: {
          gte: startOfLastMonth,
          lt: startOfCurrentMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    db.user.count({
      where: {
        role: "USER",
        status: "ACTIVE",
        bookings: {
          some: {
            status: { not: "CANCELLED" },
            updatedAt: {
              gte: startOfLastMonth,
              lt: startOfCurrentMonth,
            },
          },
        },
      },
    }),
  ]);

  const currentMonthRevenue = revenue._sum?.totalAmount?.toNumber() || 0;
  const previousMonthRevenue =
    lastMonthRevenue._sum?.totalAmount?.toNumber() || 0;
  const revenueGrowth =
    previousMonthRevenue === 0
      ? 100
      : Math.round(
          ((currentMonthRevenue - previousMonthRevenue) /
            previousMonthRevenue) *
            100
        );

  const customerGrowth =
    lastMonthCustomers === 0
      ? 100
      : Math.round(
          ((customers - lastMonthCustomers) / lastMonthCustomers) * 100
        );

  return {
    totalEvents: events,
    totalBookings: bookings,
    totalRevenue: currentMonthRevenue,
    totalCustomers: customers,
    totalReferrers: referrers,
    pendingInvites: invites,
    revenueGrowth,
    customerGrowth,
  };
}

export async function getReferrerMetrics() {
  const session = await auth();
  if (!session || session.user.role !== "REFERRER") {
    throw new Error("Unauthorized");
  }

  const startOfCurrentMonth = new Date(new Date().setDate(1));
  const startOfLastMonth = new Date(
    new Date().setMonth(new Date().getMonth() - 1, 1)
  );

  const [
    totalReferrals,
    activeReferrals,
    currentMonthEarnings,
    lastMonthEarnings,
    links,
    totalConversions,
  ] = await Promise.all([
    db.referral.count({
      where: {
        referrerId: session.user.id,
      },
    }),
    db.referral.count({
      where: {
        referrerId: session.user.id,
        referredUser: {
          status: "ACTIVE",
        },
      },
    }),
    db.referral.aggregate({
      where: {
        referrerId: session.user.id,
        createdAt: {
          gte: startOfCurrentMonth,
        },
      },
      _sum: {
        commission: true,
      },
    }),
    db.referral.aggregate({
      where: {
        referrerId: session.user.id,
        createdAt: {
          gte: startOfLastMonth,
          lt: startOfCurrentMonth,
        },
      },
      _sum: {
        commission: true,
      },
    }),
    db.referralLink.count({
      where: {
        referrerId: session.user.id,
      },
    }),
    db.referral.count({
      where: {
        referrerId: session.user.id,
        referredUser: {
          bookings: {
            some: {
              status: "COMPLETED",
            },
          },
        },
      },
    }),
  ]);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { walletBalance: true },
  });

  // Calculate metrics
  const currentEarnings =
    currentMonthEarnings._sum?.commission?.toNumber() || 0;
  const previousEarnings = lastMonthEarnings._sum?.commission?.toNumber() || 0;
  const earningsGrowth =
    previousEarnings === 0
      ? 100
      : Math.round(
          ((currentEarnings - previousEarnings) / previousEarnings) * 100
        );

  const conversionRate =
    totalReferrals === 0
      ? 0
      : Math.round((totalConversions / totalReferrals) * 100);

  return {
    totalReferrals,
    activeReferrals,
    totalEarnings: currentEarnings,
    availableBalance: user?.walletBalance?.toNumber() || 0,
    totalLinks: links,
    conversionRate,
    earningsGrowth,
  };
}

export async function getAdminMetrics() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const startOfCurrentMonth = new Date(new Date().setDate(1));
  const startOfLastMonth = new Date(
    new Date().setMonth(new Date().getMonth() - 1, 1)
  );

  const [
    users,
    hosts,
    referrers,
    events,
    currentMonthRevenue,
    lastMonthRevenue,
    payouts,
    lastMonthUsers,
  ] = await Promise.all([
    db.user.count({
      where: { status: "ACTIVE" },
    }),
    db.user.count({
      where: {
        role: "HOST",
        status: "ACTIVE",
      },
    }),
    db.user.count({
      where: {
        role: "REFERRER",
        status: "ACTIVE",
      },
    }),
    db.event.count({
      where: { status: { not: "CANCELLED" } },
    }),
    db.booking.aggregate({
      where: {
        status: "COMPLETED",
        updatedAt: {
          gte: startOfCurrentMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    db.booking.aggregate({
      where: {
        status: "COMPLETED",
        updatedAt: {
          gte: startOfLastMonth,
          lt: startOfCurrentMonth,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),
    db.payout.aggregate({
      where: { status: "PENDING" },
      _sum: {
        amount: true,
      },
    }),
    db.user.count({
      where: {
        status: "ACTIVE",
        updatedAt: {
          gte: startOfLastMonth,
          lt: startOfCurrentMonth,
        },
      },
    }),
  ]);

  // Calculate growth
  const currentRevenue = currentMonthRevenue._sum?.totalAmount?.toNumber() || 0;
  const previousRevenue = lastMonthRevenue._sum?.totalAmount?.toNumber() || 0;
  const revenueGrowth =
    previousRevenue === 0
      ? 100
      : Math.round(
          ((currentRevenue - previousRevenue) / previousRevenue) * 100
        );

  const userGrowth =
    lastMonthUsers === 0
      ? 100
      : Math.round(((users - lastMonthUsers) / lastMonthUsers) * 100);

  return {
    totalUsers: users,
    totalHosts: hosts,
    totalReferrers: referrers,
    totalEvents: events,
    totalRevenue: currentRevenue,
    pendingPayouts: payouts._sum?.amount?.toNumber() || 0,
    userGrowth,
    revenueGrowth,
  };
}
