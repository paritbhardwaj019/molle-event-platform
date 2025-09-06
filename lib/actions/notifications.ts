"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NotificationType, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendBulkPushNotifications } from "@/lib/firebase-admin";
import { removeInvalidFCMTokens } from "@/lib/actions/fcm-tokens";

export interface CreateNotificationData {
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
  data?: any;
}

export interface NotificationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function createNotification(
  data: CreateNotificationData
): Promise<NotificationResult> {
  try {
    const notification = await db.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        userId: data.userId,
        data: data.data,
      },
    });

    return { success: true, data: notification };
  } catch (error) {
    console.error("Create notification error:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

export async function getNotifications(
  page = 1,
  limit = 20,
  unreadOnly = false
): Promise<NotificationResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const where = {
      userId: session.user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, totalCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
    ]);

    return {
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      },
    };
  } catch (error) {
    console.error("Get notifications error:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

export async function getUnreadNotificationCount(): Promise<NotificationResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const unreadCount = await db.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return { success: true, data: { unreadCount } };
  } catch (error) {
    console.error("Get unread count error:", error);
    return { success: false, error: "Failed to fetch unread count" };
  }
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<NotificationResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const notification = await db.notification.updateMany({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: {
        isRead: true,
      },
    });

    if (notification.count === 0) {
      return { success: false, error: "Notification not found" };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Mark notification as read error:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

export async function markAllNotificationsAsRead(): Promise<NotificationResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Mark all notifications as read error:", error);
    return {
      success: false,
      error: "Failed to mark all notifications as read",
    };
  }
}

// Helper function to create specific notification types
export async function createDatingKycApprovalNotification(
  userId: string
): Promise<NotificationResult> {
  return createNotification({
    title: "Dating KYC Approved! 🎉",
    message:
      "Your dating verification has been approved. You can now access all dating features!",
    type: "DATING_KYC_APPROVED",
    userId,
  });
}

export async function createDatingKycRejectionNotification(
  userId: string,
  reason?: string
): Promise<NotificationResult> {
  return createNotification({
    title: "Dating KYC Update",
    message: reason
      ? `Your dating verification was not approved. Reason: ${reason}`
      : "Your dating verification was not approved. Please resubmit with correct documents.",
    type: "DATING_KYC_REJECTED",
    userId,
    data: { reason },
  });
}

export async function createNewMatchNotification(
  userId: string,
  matchedUserName: string
): Promise<NotificationResult> {
  return createNotification({
    title: "New Match! 💕",
    message: `You matched with ${matchedUserName}! Start chatting now.`,
    type: "NEW_MATCH",
    userId,
    data: { matchedUserName },
  });
}

export async function createBookingConfirmationNotification(
  userId: string,
  eventTitle: string
): Promise<NotificationResult> {
  return createNotification({
    title: "Booking Confirmed! 🎫",
    message: `Your booking for "${eventTitle}" has been confirmed.`,
    type: "BOOKING_CONFIRMED",
    userId,
    data: { eventTitle },
  });
}

// Admin Push Notification Functions
export interface AdminPushNotificationData {
  title: string;
  message: string;
  imageUrl?: string;
  linkUrl?: string;
  targetAudience: "ALL" | "HOST" | "USER" | "REFERRER";
}

export interface PushNotificationHistoryItem {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  linkUrl?: string;
  targetAudience: string;
  sentCount: number;
  successCount: number;
  failureCount: number;
  createdAt: Date;
}

export async function sendAdminPushNotification(
  data: AdminPushNotificationData
): Promise<NotificationResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Only admins can send push notifications",
      };
    }

    // Get target users based on audience
    let targetUserIds: string[] = [];

    if (data.targetAudience === "ALL") {
      const users = await db.user.findMany({
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
    } else {
      const users = await db.user.findMany({
        where: { role: data.targetAudience as UserRole },
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
    }

    // Create in-app notifications for all target users
    const notificationData = {
      title: data.title,
      message: data.message,
      type: "GENERAL" as NotificationType,
      data: {
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        type: "ADMIN_PROMOTION",
      },
    };

    const inAppNotificationPromises = targetUserIds.map((userId) =>
      createNotification({
        ...notificationData,
        userId,
      })
    );

    // Create all in-app notifications in parallel
    const inAppResults = await Promise.allSettled(inAppNotificationPromises);
    const successfulInAppNotifications = inAppResults.filter(
      (result) => result.status === "fulfilled" && result.value.success
    ).length;

    console.log(
      `Created ${successfulInAppNotifications}/${targetUserIds.length} in-app notifications`
    );

    // Get all FCM tokens for target users
    const fcmTokens = await db.fCMToken.findMany({
      where: {
        userId: { in: targetUserIds },
        lastUsed: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      select: { token: true },
    });

    const tokens = fcmTokens.map((t) => t.token);

    let pushResult = {
      success: true,
      successCount: 0,
      failureCount: 0,
      invalidTokens: [] as string[],
    };

    // Send push notifications if there are tokens
    if (tokens.length > 0) {
      const bulkResult = await sendBulkPushNotifications({
        tokens,
        title: data.title,
        body: data.message,
        imageUrl: data.imageUrl,
        data: {
          type: "ADMIN_PROMOTION",
          link: data.linkUrl || "",
        },
      });

      if (bulkResult.success) {
        pushResult = {
          success: true,
          successCount: bulkResult.successCount || 0,
          failureCount: bulkResult.failureCount || 0,
          invalidTokens: bulkResult.invalidTokens || [],
        };

        // Clean up invalid tokens if any were found
        if (pushResult.invalidTokens.length > 0) {
          console.log(
            `Cleaning up ${pushResult.invalidTokens.length} invalid tokens`
          );
          await removeInvalidFCMTokens(pushResult.invalidTokens);
        }
      } else {
        pushResult = {
          success: false,
          successCount: 0,
          failureCount: tokens.length,
          invalidTokens: [],
        };
      }
    } else {
      console.log("No FCM tokens found, but in-app notifications were created");
    }

    // Save notification history
    await db.adminPushNotification.create({
      data: {
        title: data.title,
        message: data.message,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl,
        targetAudience: data.targetAudience,
        sentCount: tokens.length,
        successCount: pushResult.success ? pushResult.successCount || 0 : 0,
        failureCount: pushResult.success
          ? pushResult.failureCount || 0
          : tokens.length,
      },
    });

    revalidatePath("/dashboard/admin/push-notifications");

    return {
      success: true,
      data: {
        sentTo: tokens.length,
        successCount: pushResult.success ? pushResult.successCount || 0 : 0,
        failureCount: pushResult.success
          ? pushResult.failureCount || 0
          : tokens.length,
        inAppNotifications: successfulInAppNotifications,
        totalTargetUsers: targetUserIds.length,
      },
    };
  } catch (error) {
    console.error("Send admin push notification error:", error);
    return {
      success: false,
      error: "Failed to send push notification",
    };
  }
}

export async function getAdminPushNotificationHistory(): Promise<NotificationResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== UserRole.ADMIN) {
      return {
        success: false,
        error: "Only admins can view push notification history",
      };
    }

    const notifications = await db.adminPushNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to last 50 notifications
    });

    return {
      success: true,
      data: notifications,
    };
  } catch (error) {
    console.error("Get push notification history error:", error);
    return {
      success: false,
      error: "Failed to fetch push notification history",
    };
  }
}
