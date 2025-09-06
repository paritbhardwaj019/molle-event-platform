import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { broadcastMessage } from "@/app/api/realtime/messages/route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;
    const { conversationId } = await params;

    // Verify user has access to this conversation
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        hostId: true,
        adminId: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Check if user is part of this conversation
    if (
      (userRole === "HOST" && conversation.hostId !== userId) ||
      (userRole === "ADMIN" && conversation.adminId !== userId)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get messages
    const messages = await db.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Mark messages as read for the current user
    const updatedMessages = await db.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Broadcast read status if any messages were marked as read
    if (updatedMessages.count > 0) {
      // Get the conversation to know who to notify
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        select: { hostId: true, adminId: true },
      });

      if (conversation) {
        const otherUserId =
          conversation.hostId === userId
            ? conversation.adminId
            : conversation.hostId;
        broadcastMessage(
          {
            type: "message_read",
            conversationId,
            readByUserId: userId,
            timestamp: Date.now(),
          },
          otherUserId,
          "admin"
        );
      }
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
