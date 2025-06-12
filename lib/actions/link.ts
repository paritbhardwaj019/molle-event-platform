"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { nanoid } from "nanoid";
import { UserRole, ReferralLinkType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type { ReferralLinkType };

export type ReferralLink = {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  type: ReferralLinkType;
  eventId?: string;
  signupCount: number;
  walletBalance: number;
  createdAt: Date;
  updatedAt: Date;
  event?: {
    id: string;
    title: string;
    slug: string;
  } | null;
};

export type CreateLinkInput = {
  type: ReferralLinkType;
  eventId?: string;
};

export async function createReferralLink(input: CreateLinkInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to create a referral link",
      };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== UserRole.REFERRER) {
      return {
        success: false,
        error: "Only referrers can create referral links",
      };
    }

    if (input.type === ReferralLinkType.EVENT && input.eventId) {
      const event = await db.event.findUnique({
        where: { id: input.eventId },
        select: {
          id: true,
          slug: true,
        },
      });
    }

    const referralCode = nanoid(8);

    const referralLink = await db.referralLink.create({
      data: {
        referralCode,
        type: input.type,
        eventId: input.eventId,
        referrerId: session.user.id,
      },
    });

    revalidatePath("/dashboard/links");

    return {
      success: true,
      data: { referralCode: referralLink.referralCode },
    };
  } catch (error) {
    console.error("Error creating referral link:", error);
    return {
      success: false,
      error: "Failed to create referral link",
    };
  }
}

export async function getReferrerEvents() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view events",
      };
    }

    const events = await db.event.findMany({
      where: {
        allowedReferrers: {
          some: { id: session.user.id },
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: events,
    };
  } catch (error) {
    console.error("Error fetching referrer events:", error);
    return {
      success: false,
      error: "Failed to fetch events",
    };
  }
}

export async function getAllReferralLinks() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view referral links",
      };
    }

    // For referrers, only show their own links
    const where =
      session.user.role === UserRole.REFERRER
        ? { referrerId: session.user.id }
        : {
            referrer: {
              OR: [{ role: UserRole.REFERRER }, { role: UserRole.HOST }],
            },
          };

    const links = await db.referralLink.findMany({
      where,
      include: {
        referrer: {
          select: {
            id: true,
            name: true,
            email: true,
            walletBalance: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        signups: true,
        bookings: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedLinks = links.map((link) => ({
      id: link.id,
      name: link.referrer.name,
      email: link.referrer.email,
      referralCode: link.referralCode,
      type: link.type,
      signupCount:
        link.type === ReferralLinkType.SIGNUP
          ? link.signups.length
          : link.bookings.length,
      walletBalance: Number(link.referrer.walletBalance),
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      event: link.event,
    }));

    return {
      success: true,
      data: formattedLinks,
    };
  } catch (error) {
    console.error("Error fetching referral links:", error);
    return {
      success: false,
      error: "Failed to fetch referral links",
    };
  }
}

export async function deleteReferralLink(linkId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to delete a referral link",
      };
    }

    const link = await db.referralLink.findFirst({
      where: {
        id: linkId,
        referrerId: session.user.id,
      },
      include: {
        signups: true,
        bookings: true,
      },
    });

    if (!link) {
      return {
        success: false,
        error:
          "Referral link not found or you don't have permission to delete it",
      };
    }

    const actionCount = link.signups.length + link.bookings.length;
    if (actionCount > 1) {
      return {
        success: false,
        error: "You can't delete a link that has been used more than once",
      };
    }

    await db.referralLink.delete({
      where: {
        id: linkId,
      },
    });

    revalidatePath("/dashboard/links");

    return { success: true };
  } catch (error) {
    console.error("Error deleting referral link:", error);
    return {
      success: false,
      error: "Failed to delete referral link",
    };
  }
}
