"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { startOfDay } from "date-fns";
import { ReferralLinkType, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getReferralStats() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view referral stats",
      };
    }

    // Get total revenue and referrals
    const totalStats = await db.referral.aggregate({
      where: {
        referrerId: session.user.id,
      },
      _sum: {
        commission: true,
      },
      _count: true,
    });

    // Get today's revenue
    const today = startOfDay(new Date());
    const todayStats = await db.referral.aggregate({
      where: {
        referrerId: session.user.id,
        createdAt: {
          gte: today,
        },
      },
      _sum: {
        commission: true,
      },
    });

    return {
      success: true,
      data: {
        totalRevenue: Number(totalStats._sum.commission || 0),
        todayRevenue: Number(todayStats._sum.commission || 0),
        totalReferrals: totalStats._count || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    return {
      success: false,
      error: "Failed to fetch referral stats",
    };
  }
}

export async function getUserReferrals() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view referrals",
      };
    }

    const referrals = await db.referral.findMany({
      where: {
        referrerId: session.user.id,
      },
      include: {
        referredUser: {
          select: {
            name: true,
            email: true,
          },
        },
        referralLink: {
          include: {
            event: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedReferrals = referrals.map((referral) => ({
      id: referral.id,
      commission: Number(referral.commission),
      isPaid: referral.isCommissionPaid,
      createdAt: referral.createdAt,
      customer: {
        name: referral.referredUser.name,
        email: referral.referredUser.email,
      },
      event: referral.referralLink?.event
        ? {
            title: referral.referralLink.event.title,
            slug: referral.referralLink.event.slug,
          }
        : null,
    }));

    return {
      success: true,
      data: formattedReferrals,
    };
  } catch (error) {
    console.error("Error fetching user referrals:", error);
    return {
      success: false,
      error: "Failed to fetch referrals",
    };
  }
}

export async function createHostReferralCode() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to create a referral code",
      };
    }

    // Check if user is a HOST
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.HOST) {
      return {
        success: false,
        error: "Only hosts can create host referral codes",
      };
    }

    // Generate a unique referral code
    const referralCode = `HOST-${session.user.id.substring(
      0,
      6
    )}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create the referral link
    const referralLink = await db.referralLink.create({
      data: {
        referralCode,
        type: ReferralLinkType.EVENT,
        referrerId: session.user.id,
        hostId: session.user.id,
      },
    });

    return {
      success: true,
      data: referralLink,
    };
  } catch (error) {
    console.error("Error creating host referral code:", error);
    return {
      success: false,
      error: "Failed to create referral code",
    };
  }
}

export async function getHostReferrers() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view your referrers",
      };
    }

    // Check if user is a HOST
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.HOST) {
      return {
        success: false,
        error: "Only hosts can view their referrers",
      };
    }

    // Get all users referred by this host
    const referrers = await db.user.findMany({
      where: {
        referredByHostId: session.user.id,
        role: UserRole.REFERRER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        referrals: {
          select: {
            id: true,
            commission: true,
            isCommissionPaid: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedReferrers = referrers.map((referrer) => ({
      id: referrer.id,
      name: referrer.name,
      email: referrer.email,
      status: referrer.status,
      createdAt: referrer.createdAt,
      totalReferrals: referrer.referrals.length,
      totalCommission: referrer.referrals.reduce(
        (sum, referral) => sum + Number(referral.commission),
        0
      ),
    }));

    return {
      success: true,
      data: formattedReferrers,
    };
  } catch (error) {
    console.error("Error fetching host referrers:", error);
    return {
      success: false,
      error: "Failed to fetch referrers",
    };
  }
}

export async function signupAsReferrer(hostReferralCode: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to become a referrer",
      };
    }

    // Find the referral link
    const referralLink = await db.referralLink.findUnique({
      where: {
        referralCode: hostReferralCode,
        type: ReferralLinkType.EVENT,
      },
      include: {
        referrer: true,
      },
    });

    if (!referralLink || !referralLink.hostId) {
      return {
        success: false,
        error: "Invalid referral code",
      };
    }

    // Update the user to become a referrer under this host
    await db.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        role: UserRole.REFERRER,
        referredByHostId: referralLink.hostId,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error signing up as referrer:", error);
    return {
      success: false,
      error: "Failed to sign up as referrer",
    };
  }
}

export async function getUserReferralsForDashboard() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view referrals",
      };
    }

    // For REFERRER role - get their own referrals
    if (session.user.role === "REFERRER") {
      const referrals = await db.referral.findMany({
        where: {
          referrerId: session.user.id,
        },
        include: {
          referredUser: {
            select: {
              name: true,
              email: true,
            },
          },
          referralLink: {
            include: {
              event: {
                select: {
                  title: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const formattedReferrals = referrals.map((referral) => ({
        id: referral.id,
        commission: Number(referral.commission),
        isPaid: referral.isCommissionPaid,
        createdAt: referral.createdAt,
        customer: {
          name: referral.referredUser.name,
          email: referral.referredUser.email,
        },
        event: referral.referralLink?.event
          ? {
              title: referral.referralLink.event.title,
              slug: referral.referralLink.event.slug,
            }
          : null,
      }));

      return {
        success: true,
        data: formattedReferrals,
      };
    }

    // For HOST role - get referrals made through their events
    if (session.user.role === "HOST") {
      const referrals = await db.referral.findMany({
        where: {
          referralLink: {
            event: {
              hostId: session.user.id,
            },
          },
        },
        include: {
          referredUser: {
            select: {
              name: true,
              email: true,
            },
          },
          referralLink: {
            include: {
              event: {
                select: {
                  title: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const formattedReferrals = referrals.map((referral) => ({
        id: referral.id,
        commission: Number(referral.commission),
        isPaid: referral.isCommissionPaid,
        createdAt: referral.createdAt,
        customer: {
          name: referral.referredUser.name,
          email: referral.referredUser.email,
        },
        event: referral.referralLink?.event
          ? {
              title: referral.referralLink.event.title,
              slug: referral.referralLink.event.slug,
            }
          : null,
      }));

      return {
        success: true,
        data: formattedReferrals,
      };
    }

    // For ADMIN role - get all referrals
    if (session.user.role === "ADMIN") {
      const referrals = await db.referral.findMany({
        include: {
          referredUser: {
            select: {
              name: true,
              email: true,
            },
          },
          referralLink: {
            include: {
              event: {
                select: {
                  title: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const formattedReferrals = referrals.map((referral) => ({
        id: referral.id,
        commission: Number(referral.commission),
        isPaid: referral.isCommissionPaid,
        createdAt: referral.createdAt,
        customer: {
          name: referral.referredUser.name,
          email: referral.referredUser.email,
        },
        event: referral.referralLink?.event
          ? {
              title: referral.referralLink.event.title,
              slug: referral.referralLink.event.slug,
            }
          : null,
      }));

      return {
        success: true,
        data: formattedReferrals,
      };
    }

    return {
      success: false,
      error: "Unauthorized to view referrals",
    };
  } catch (error) {
    console.error("Error fetching user referrals for dashboard:", error);
    return {
      success: false,
      error: "Failed to fetch referrals",
    };
  }
}
