"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { DatingKycRequest } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sendDatingKycApprovalEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/firebase-admin";
import { getUserFCMTokens } from "@/lib/actions/fcm-tokens";

export interface DatingKycRequestWithUser extends DatingKycRequest {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  };
}

export interface DatingKycRequestsResult {
  success: boolean;
  data?: DatingKycRequestWithUser[];
  error?: string;
}

export interface DatingKycActionResult {
  success: boolean;
  error?: string;
}

export async function getAllDatingKycRequests(): Promise<DatingKycRequestsResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }

    const requests = await db.datingKycRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return { success: true, data: requests };
  } catch (error) {
    console.error("Get all dating KYC requests error:", error);
    return { success: false, error: "Failed to fetch KYC requests" };
  }
}

export async function approveDatingKyc(
  requestId: string
): Promise<DatingKycActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }

    // Get the request with user details before updating
    const request = await db.datingKycRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      return { success: false, error: "KYC request not found" };
    }

    if (request.status !== "PENDING") {
      return { success: false, error: "KYC request is not pending" };
    }

    await db.datingKycRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedBy: session.user.id,
        reviewedAt: new Date(),
        reason: null,
      },
    });

    // Send approval email to the user
    if (request.user.email && request.user.name) {
      await sendDatingKycApprovalEmail(request.user.name, request.user.email);
    }

    // Send push notification to the user
    try {
      const fcmTokens = await getUserFCMTokens(request.user.id);
      if (fcmTokens.length > 0) {
        const pushPromises = fcmTokens.map(token =>
          sendPushNotification({
            token,
            title: "Dating KYC Approved! 🎉",
            body: `Congratulations ${request.user.name}! Your dating profile has been approved. You can now start connecting with others.`,
            data: {
              type: "DATING_KYC_APPROVED",
              userId: request.user.id,
              link: "/dashboard/social/discover",
            },
          })
        );
        
        await Promise.allSettled(pushPromises);
        console.log(`Sent push notifications to ${fcmTokens.length} devices for user ${request.user.id}`);
      }
    } catch (error) {
      console.error("Error sending push notification for dating KYC approval:", error);
      // Don't fail the entire operation if push notification fails
    }

    revalidatePath("/dashboard/admin/dating-kyc");
    return { success: true };
  } catch (error) {
    console.error("Approve dating KYC error:", error);
    return { success: false, error: "Failed to approve KYC request" };
  }
}

export async function rejectDatingKyc(
  requestId: string,
  reason: string
): Promise<DatingKycActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }

    const request = await db.datingKycRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: "KYC request not found" };
    }

    if (request.status !== "PENDING") {
      return { success: false, error: "KYC request is not pending" };
    }

    await db.datingKycRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        approvedBy: session.user.id,
        reviewedAt: new Date(),
        reason,
      },
    });

    revalidatePath("/dashboard/admin/dating-kyc");
    return { success: true };
  } catch (error) {
    console.error("Reject dating KYC error:", error);
    return { success: false, error: "Failed to reject KYC request" };
  }
}
