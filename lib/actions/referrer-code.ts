"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { nanoid } from "nanoid";
import { validateReferrerCode as validateReferrerCodeFromAuth } from "@/lib/actions/auth";

export interface ReferrerCode {
  id: string;
  code: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  referrerCount: number;
}

export async function getAllReferrerCodes() {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    if (session.user.role !== UserRole.HOST) {
      return { success: false, error: "Only hosts can manage referrer codes" };
    }

    const hostId = session.user.id;

    // Get all referrer codes with their referrer counts
    const referrerCodes = await db.hostReferrerCode.findMany({
      where: {
        hostId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: { referrers: true },
        },
      },
    });

    // Transform the data for the client
    const formattedCodes: ReferrerCode[] = referrerCodes.map((code) => ({
      id: code.id,
      code: code.code,
      description: code.description,
      createdAt: code.createdAt.toISOString(),
      updatedAt: code.updatedAt.toISOString(),
      referrerCount: code._count.referrers,
    }));

    return { success: true, data: formattedCodes };
  } catch (error) {
    console.error("Error fetching referrer codes:", error);
    return { success: false, error: "Failed to fetch referrer codes" };
  }
}

interface CreateReferrerCodeParams {
  description: string | null;
}

export async function createReferrerCode({
  description,
}: CreateReferrerCodeParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    if (session.user.role !== UserRole.HOST) {
      return { success: false, error: "Only hosts can create referrer codes" };
    }

    const hostId = session.user.id;

    // Generate a unique code
    const code = nanoid(8);

    // Create the referrer code
    const referrerCode = await db.hostReferrerCode.create({
      data: {
        code,
        description,
        hostId,
      },
    });

    return { success: true, data: referrerCode };
  } catch (error) {
    console.error("Error creating referrer code:", error);
    return { success: false, error: "Failed to create referrer code" };
  }
}

export async function deleteReferrerCode(id: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    if (session.user.role !== UserRole.HOST) {
      return { success: false, error: "Only hosts can delete referrer codes" };
    }

    const hostId = session.user.id;

    const existingCode = await db.hostReferrerCode.findFirst({
      where: {
        id,
        hostId,
      },
      include: {
        _count: {
          select: { referrers: true },
        },
      },
    });

    if (!existingCode) {
      return { success: false, error: "Referrer code not found" };
    }

    if (existingCode._count.referrers > 0) {
      return {
        success: false,
        error: "Cannot delete a code with active referrers",
      };
    }

    // Delete the code
    await db.hostReferrerCode.delete({
      where: {
        id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting referrer code:", error);
    return { success: false, error: "Failed to delete referrer code" };
  }
}

// Wrapper async function to make it compatible with "use server"
export async function validateReferrerCode(code: string) {
  return validateReferrerCodeFromAuth(code);
}
