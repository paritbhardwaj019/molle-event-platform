"use server";

import { db } from "@/lib/db";
import { z } from "zod";
import { UserRole, UserStatus } from "@prisma/client";

const referrerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ReferrerFormData = z.infer<typeof referrerSchema>;

export type Referrer = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  walletBalance: number;
  referralCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  phone: string | null;
  referralCount: number;
  referredUsers: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  }[];
};

export async function getAllReferrers() {
  try {
    const referrers = await db.user.findMany({
      where: {
        OR: [{ role: "REFERRER" }],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        walletBalance: true,
        referralCode: true,
        createdAt: true,
        updatedAt: true,
        phone: true,
        referrals: {
          select: {
            referredUser: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: referrers.map((referrer) => ({
        ...referrer,
        referredUsers: referrer.referrals.map((r) => r.referredUser),
        referralCount: referrer.referrals.length,
      })),
    };
  } catch (error) {
    console.error("Error fetching referrers:", error);
    return {
      success: false,
      error: "Failed to fetch referrers",
    };
  }
}

export async function deleteReferrer(referrerId: string) {
  try {
    // First check if the referrer exists
    const referrer = await db.user.findUnique({
      where: { id: referrerId },
      select: { role: true },
    });

    if (!referrer) {
      return {
        success: false,
        error: "Referrer not found",
      };
    }

    if (referrer.role !== "REFERRER" && referrer.role !== "HOST") {
      return {
        success: false,
        error: "Invalid user role for deletion",
      };
    }

    // Delete the referrer and all related data
    await db.user.delete({
      where: { id: referrerId },
    });

    return {
      success: true,
      message: "Referrer deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting referrer:", error);
    return {
      success: false,
      error: "Failed to delete referrer",
    };
  }
}
