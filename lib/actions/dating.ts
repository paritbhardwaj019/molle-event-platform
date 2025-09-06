"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  DatingKycRequest,
  Like,
  Match,
  SocialConversation,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  createDatingKycApprovalNotification,
  createDatingKycRejectionNotification,
  createNewMatchNotification,
} from "@/lib/actions/notifications";

export interface DatingKycSubmission {
  docType: "AADHAAR" | "PASSPORT" | "DRIVING_LICENSE";
  selfieUrl: string;
  docFrontUrl: string;
  docBackUrl?: string;
}

export interface DatingKycResult {
  success: boolean;
  data?: DatingKycRequest;
  error?: string;
}

export interface LikesResult {
  success: boolean;
  data?: {
    likes: Array<{
      id: string;
      liker: {
        id: string;
        name: string;
        avatar: string | null;
        age?: number;
      };
      createdAt: string;
    }>;
    isPremium: boolean;
  };
  error?: string;
}

export interface MatchesResult {
  success: boolean;
  data?: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      avatar: string | null;
      age?: number;
    };
    createdAt: string;
    conversationId: string | null;
  }>;
  error?: string;
}

export interface LikeResult {
  success: boolean;
  data?: {
    isMatch: boolean;
    matchId?: string;
  };
  error?: string;
}

export async function submitDatingKyc(
  data: DatingKycSubmission
): Promise<DatingKycResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user already has a KYC request
    const existingRequest = await db.datingKycRequest.findUnique({
      where: { userId: session.user.id },
    });

    if (existingRequest && existingRequest.status === "APPROVED") {
      return { success: false, error: "KYC already approved" };
    }

    // Create or update KYC request
    const kycRequest = await db.datingKycRequest.upsert({
      where: { userId: session.user.id },
      update: {
        docType: data.docType,
        selfieUrl: data.selfieUrl,
        docFrontUrl: data.docFrontUrl,
        docBackUrl: data.docBackUrl,
        status: "PENDING",
        reason: null,
        approvedBy: null,
        reviewedAt: null,
      },
      create: {
        userId: session.user.id,
        docType: data.docType,
        selfieUrl: data.selfieUrl,
        docFrontUrl: data.docFrontUrl,
        docBackUrl: data.docBackUrl,
        status: "PENDING",
      },
    });

    revalidatePath("/dashboard");
    return { success: true, data: kycRequest };
  } catch (error) {
    console.error("KYC submission error:", error);
    return { success: false, error: "Failed to submit KYC" };
  }
}

export async function getMyDatingKyc(): Promise<DatingKycResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const kycRequest = await db.datingKycRequest.findUnique({
      where: { userId: session.user.id },
    });

    return { success: true, data: kycRequest || undefined };
  } catch (error) {
    console.error("Get KYC error:", error);
    return { success: false, error: "Failed to fetch KYC" };
  }
}

export async function likeUser(likedUserId: string): Promise<LikeResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    if (session.user.id === likedUserId) {
      return { success: false, error: "Cannot like yourself" };
    }

    // Check if already liked
    const existingLike = await db.like.findUnique({
      where: {
        likerId_likedId: {
          likerId: session.user.id,
          likedId: likedUserId,
        },
      },
    });

    if (existingLike) {
      return { success: false, error: "Already liked this user" };
    }

    // Create the like
    const like = await db.like.create({
      data: {
        likerId: session.user.id,
        likedId: likedUserId,
      },
    });

    // Check if it's a mutual like (match)
    const mutualLike = await db.like.findUnique({
      where: {
        likerId_likedId: {
          likerId: likedUserId,
          likedId: session.user.id,
        },
      },
    });

    if (mutualLike) {
      // Get user names for notifications
      const [currentUser, likedUser] = await Promise.all([
        db.user.findUnique({
          where: { id: session.user.id },
          select: { name: true },
        }),
        db.user.findUnique({
          where: { id: likedUserId },
          select: { name: true },
        }),
      ]);

      // Create a match
      const match = await db.match.create({
        data: {
          user1Id: session.user.id,
          user2Id: likedUserId,
        },
      });

      // Create a conversation for the match
      const conversation = await db.socialConversation.create({
        data: {
          matchId: match.id,
        },
      });

      // Update match with conversation ID
      await db.match.update({
        where: { id: match.id },
        data: { conversationId: conversation.id },
      });

      // Create notifications for both users
      if (currentUser && likedUser) {
        await Promise.all([
          createNewMatchNotification(session.user.id, likedUser.name),
          createNewMatchNotification(likedUserId, currentUser.name),
        ]);
      }

      revalidatePath("/dashboard");
      return { success: true, data: { isMatch: true, matchId: match.id } };
    }

    revalidatePath("/dashboard");
    return { success: true, data: { isMatch: false } };
  } catch (error) {
    console.error("Like user error:", error);
    return { success: false, error: "Failed to like user" };
  }
}

export async function getLikesReceived(): Promise<LikesResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if user has premium subscription
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { activePackage: true },
    });

    const isPremium = user?.activePackage !== null;

    if (!isPremium) {
      // For non-premium users, just return the count
      const likeCount = await db.like.count({
        where: { likedId: session.user.id },
      });

      return {
        success: true,
        data: {
          likes: [],
          isPremium: false,
        },
      };
    }

    // For premium users, return the actual likes
    const likes = await db.like.findMany({
      where: { likedId: session.user.id },
      include: {
        liker: {
          select: {
            id: true,
            name: true,
            avatar: true,
            birthday: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedLikes = likes.map((like) => ({
      id: like.id,
      liker: {
        id: like.liker.id,
        name: like.liker.name,
        avatar: like.liker.avatar,
        age: like.liker.birthday
          ? new Date().getFullYear() -
            new Date(like.liker.birthday).getFullYear()
          : undefined,
      },
      createdAt: like.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: {
        likes: formattedLikes,
        isPremium: true,
      },
    };
  } catch (error) {
    console.error("Get likes error:", error);
    return { success: false, error: "Failed to fetch likes" };
  }
}

export async function getMatches(): Promise<MatchesResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const matches = await db.match.findMany({
      where: {
        OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
        status: "ACTIVE",
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            birthday: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            birthday: true,
          },
        },
        conversation: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedMatches = matches.map((match) => {
      const otherUser =
        match.user1Id === session.user.id ? match.user2 : match.user1;
      return {
        id: match.id,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          age: otherUser.birthday
            ? new Date().getFullYear() -
              new Date(otherUser.birthday).getFullYear()
            : undefined,
        },
        createdAt: match.createdAt.toISOString(),
        conversationId: match.conversationId,
      };
    });

    return { success: true, data: formattedMatches };
  } catch (error) {
    console.error("Get matches error:", error);
    return { success: false, error: "Failed to fetch matches" };
  }
}

export async function startChat(
  matchId: string
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify the match exists and user is part of it
    const match = await db.match.findFirst({
      where: {
        id: matchId,
        OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
        status: "ACTIVE",
      },
      include: { conversation: true },
    });

    if (!match) {
      return { success: false, error: "Match not found" };
    }

    // If conversation doesn't exist, create it
    if (!match.conversationId) {
      const conversation = await db.socialConversation.create({
        data: { matchId: match.id },
      });

      await db.match.update({
        where: { id: match.id },
        data: { conversationId: conversation.id },
      });

      return { success: true, conversationId: conversation.id };
    }

    return { success: true, conversationId: match.conversationId };
  } catch (error) {
    console.error("Start chat error:", error);
    return { success: false, error: "Failed to start chat" };
  }
}

// Admin function to approve KYC
export async function approveDatingKyc(
  kycRequestId: string
): Promise<DatingKycResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }

    const kycRequest = await db.datingKycRequest.update({
      where: { id: kycRequestId },
      data: {
        status: "APPROVED",
        approvedBy: session.user.id,
        reviewedAt: new Date(),
        reason: null,
      },
      include: { user: true },
    });

    // Create approval notification
    await createDatingKycApprovalNotification(kycRequest.userId);

    revalidatePath("/admin");
    return { success: true, data: kycRequest };
  } catch (error) {
    console.error("Approve KYC error:", error);
    return { success: false, error: "Failed to approve KYC" };
  }
}

// Admin function to reject KYC
export async function rejectDatingKyc(
  kycRequestId: string,
  reason: string
): Promise<DatingKycResult> {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return { success: false, error: "Not authorized" };
    }

    const kycRequest = await db.datingKycRequest.update({
      where: { id: kycRequestId },
      data: {
        status: "REJECTED",
        approvedBy: session.user.id,
        reviewedAt: new Date(),
        reason,
      },
      include: { user: true },
    });

    // Create rejection notification
    await createDatingKycRejectionNotification(kycRequest.userId, reason);

    revalidatePath("/admin");
    return { success: true, data: kycRequest };
  } catch (error) {
    console.error("Reject KYC error:", error);
    return { success: false, error: "Failed to reject KYC" };
  }
}
