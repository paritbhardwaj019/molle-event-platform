"use server";

import { db } from "@/lib/db";
import { InviteStatus } from "@prisma/client";

interface CreateInviteRequestParams {
  userId: string;
  eventId: string;
  instagramHandle: string;
  message?: string;
}

interface ApproveInviteParams {
  inviteId: string;
}

interface RejectInviteParams {
  inviteId: string;
  reason: string;
}

// Helper function to serialize data for client components
function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data.toJSON === "function") {
    return data.toJSON();
  }

  if (Array.isArray(data)) {
    return data.map(serializeData);
  }

  if (typeof data === "object") {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, serializeData(value)])
    );
  }

  return data;
}

export async function createInviteRequest({
  userId,
  eventId,
  instagramHandle,
  message,
}: CreateInviteRequestParams) {
  try {
    const existingRequest = await db.inviteRequest.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existingRequest) {
      return {
        success: false,
        error: "You have already requested an invite for this event",
      };
    }

    const inviteRequest = await db.inviteRequest.create({
      data: {
        userId,
        eventId,
        message: `Instagram: ${instagramHandle}${
          message ? `\n\nNotes: ${message}` : ""
        }`,
        status: InviteStatus.PENDING,
      },
    });

    return {
      success: true,
      data: serializeData(inviteRequest),
    };
  } catch (error) {
    console.error("Error creating invite request:", error);
    return {
      success: false,
      error: "Failed to create invite request",
    };
  }
}

export async function getAllInvites(eventId?: string) {
  try {
    const invites = await db.inviteRequest.findMany({
      where: eventId ? { eventId } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: serializeData(invites),
    };
  } catch (error) {
    console.error("Error fetching invites:", error);
    return {
      success: false,
      error: "Failed to fetch invites",
    };
  }
}

export async function approveInvite({ inviteId }: ApproveInviteParams) {
  try {
    const invite = await db.inviteRequest.update({
      where: { id: inviteId },
      data: {
        status: InviteStatus.APPROVED,
      },
    });

    return {
      success: true,
      data: serializeData(invite),
    };
  } catch (error) {
    console.error("Error approving invite:", error);
    return {
      success: false,
      error: "Failed to approve invite",
    };
  }
}

export async function rejectInvite({ inviteId, reason }: RejectInviteParams) {
  try {
    const invite = await db.inviteRequest.update({
      where: { id: inviteId },
      data: {
        status: InviteStatus.REJECTED,
        message: reason,
      },
    });

    return {
      success: true,
      data: serializeData(invite),
    };
  } catch (error) {
    console.error("Error rejecting invite:", error);
    return {
      success: false,
      error: "Failed to reject invite",
    };
  }
}

export async function getInviteStatusForUserAndEvent(
  userId: string,
  eventId: string
) {
  try {
    const invite = await db.inviteRequest.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    return {
      success: true,
      data: serializeData(invite),
    };
  } catch (error) {
    console.error("Error fetching invite status:", error);
    return {
      success: false,
      error: "Failed to fetch invite status",
    };
  }
}
