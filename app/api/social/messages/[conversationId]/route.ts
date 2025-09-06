import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1).max(1000),
});

// GET - Fetch messages for a social conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Verify user has access to this conversation
    const conversation = await db.socialConversation.findFirst({
      where: {
        id: conversationId,
        match: {
          OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
          status: "ACTIVE",
        },
      },
      include: {
        match: {
          include: {
            user1: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            user2: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Fetch messages
    const messages = await db.socialMessage.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Mark messages as read
    await db.socialMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Format response
    const otherUser =
      conversation.match?.user1Id === session.user.id
        ? conversation.match.user2
        : conversation.match?.user1;

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          matchId: conversation.matchId,
          otherUser,
        },
        messages: messages.reverse(), // Oldest first for display
        pagination: {
          limit,
          offset,
          hasMore: messages.length === limit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching social messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Send a message in a social conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const body = await request.json();
    const { content } = messageSchema.parse(body);

    // Verify user has access to this conversation
    const conversation = await db.socialConversation.findFirst({
      where: {
        id: conversationId,
        match: {
          OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
          status: "ACTIVE",
        },
      },
      include: {
        match: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Create message
    const message = await db.socialMessage.create({
      data: {
        content,
        senderId: session.user.id,
        conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update conversation timestamp
    await db.socialConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid message content", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error sending social message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
