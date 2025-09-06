"use server";

import { db } from "@/lib/db";
import { InviteStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { sendInviteApprovalEmail } from "@/lib/email";
import { format } from "date-fns";

interface CreateInviteRequestParams {
  userId: string;
  eventId: string;
  formData: Record<string, any>;
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
  formData,
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
        formData: formData,
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
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to view invites",
      };
    }

    // Check user role and permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "HOST" && user.role !== "ADMIN")) {
      return {
        success: false,
        error: "Only hosts and admins can view invites",
      };
    }

    let whereClause: any = {};

    // If eventId is provided, filter by that event
    if (eventId) {
      whereClause.eventId = eventId;
    }

    // If user is HOST, only show invites for events they created
    if (user.role === "HOST") {
      whereClause.event = {
        hostId: session.user.id,
      };
    }
    // Admin can see all invites (no additional filtering needed)

    const invites = await db.inviteRequest.findMany({
      where: whereClause,
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
            hostId: true,
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
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to approve invites",
      };
    }

    // Check user role and permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "HOST" && user.role !== "ADMIN")) {
      return {
        success: false,
        error: "Only hosts and admins can approve invites",
      };
    }

    // If user is HOST, verify they own the event
    if (user.role === "HOST") {
      const inviteRequest = await db.inviteRequest.findUnique({
        where: { id: inviteId },
        include: {
          event: {
            select: { hostId: true },
          },
        },
      });

      if (!inviteRequest || inviteRequest.event.hostId !== session.user.id) {
        return {
          success: false,
          error: "You can only approve invites for your own events",
        };
      }
    }

    // Fetch invite request with user and event details for email
    const inviteWithDetails = await db.inviteRequest.findUnique({
      where: { id: inviteId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            title: true,
            slug: true,
            startDate: true,
            endDate: true,
            location: true,
            hostId: true,
          },
        },
      },
    });

    if (!inviteWithDetails) {
      return {
        success: false,
        error: "Invite request not found",
      };
    }

    // Update the invite status
    const invite = await db.inviteRequest.update({
      where: { id: inviteId },
      data: {
        status: InviteStatus.APPROVED,
      },
    });

    // Get host details for email
    const host = await db.user.findUnique({
      where: { id: inviteWithDetails.event.hostId },
      select: {
        name: true,
      },
    });

    // Send approval email notification
    try {
      await sendInviteApprovalEmail({
        userName: inviteWithDetails.user.name,
        userEmail: inviteWithDetails.user.email,
        eventTitle: inviteWithDetails.event.title,
        eventDate: format(new Date(inviteWithDetails.event.startDate), "PPPP"),
        eventTime: format(new Date(inviteWithDetails.event.startDate), "p"),
        eventLocation: inviteWithDetails.event.location,
        hostName: host?.name || "Event Host",
        eventSlug: inviteWithDetails.event.slug,
      });
    } catch (emailError) {
      console.error("Failed to send invite approval email:", emailError);
      // Don't fail the whole operation if email fails
    }

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
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to reject invites",
      };
    }

    // Check user role and permissions
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== "HOST" && user.role !== "ADMIN")) {
      return {
        success: false,
        error: "Only hosts and admins can reject invites",
      };
    }

    // If user is HOST, verify they own the event
    if (user.role === "HOST") {
      const inviteRequest = await db.inviteRequest.findUnique({
        where: { id: inviteId },
        include: {
          event: {
            select: { hostId: true },
          },
        },
      });

      if (!inviteRequest || inviteRequest.event.hostId !== session.user.id) {
        return {
          success: false,
          error: "You can only reject invites for your own events",
        };
      }
    }

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
