"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export interface FCMTokenResult {
  success: boolean;
  error?: string;
}

export async function saveFCMToken(token: string): Promise<FCMTokenResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Use upsert to handle the unique constraint gracefully
    // This will update if the token exists, or create if it doesn't
    await db.fCMToken.upsert({
      where: { token },
      update: {
        userId: session.user.id,
        lastUsed: new Date(),
      },
      create: {
        userId: session.user.id,
        token,
        lastUsed: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving FCM token:", error);
    return { success: false, error: "Failed to save FCM token" };
  }
}

// Get all active FCM tokens for a user
export async function getUserFCMTokens(userId: string): Promise<string[]> {
  try {
    const tokens = await db.fCMToken.findMany({
      where: {
        userId,
        // Only get tokens that were used in the last 30 days
        lastUsed: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        token: true,
      },
    });

    return tokens.map((t: { token: string }) => t.token);
  } catch (error) {
    console.error("Error getting user FCM tokens:", error);
    return [];
  }
}

// Remove FCM token
export async function removeFCMToken(token: string): Promise<FCMTokenResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await db.fCMToken.deleteMany({
      where: {
        userId: session.user.id,
        token,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error removing FCM token:", error);
    return { success: false, error: "Failed to remove FCM token" };
  }
}

// Clean up old FCM tokens (called by a cron job)
export async function cleanupOldFCMTokens(): Promise<FCMTokenResult> {
  try {
    // Delete tokens that haven't been used in 60 days
    const cutoffDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const result = await db.fCMToken.deleteMany({
      where: {
        lastUsed: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`Cleaned up ${result.count} old FCM tokens`);
    return { success: true };
  } catch (error) {
    console.error("Error cleaning up old FCM tokens:", error);
    return { success: false, error: "Failed to cleanup old FCM tokens" };
  }
}

// Remove invalid FCM tokens from database
export async function removeInvalidFCMTokens(
  invalidTokens: string[]
): Promise<FCMTokenResult> {
  try {
    if (invalidTokens.length === 0) {
      return { success: true };
    }

    const result = await db.fCMToken.deleteMany({
      where: {
        token: {
          in: invalidTokens,
        },
      },
    });

    console.log(`Removed ${result.count} invalid FCM tokens`);
    return { success: true };
  } catch (error) {
    console.error("Error removing invalid FCM tokens:", error);
    return { success: false, error: "Failed to remove invalid FCM tokens" };
  }
}
