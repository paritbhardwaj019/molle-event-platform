import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { broadcastMessage } from "@/app/api/realtime/messages/route";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    let conversations;

    if (userRole === "USER") {
      conversations = await db.userHostConversation.findMany({
        where: {
          userId: userId,
        },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: {
                    not: userId,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    } else if (userRole === "HOST") {
      // Hosts can see their conversations with users
      conversations = await db.userHostConversation.findMany({
        where: {
          hostId: userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          messages: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: {
                    not: userId,
                  },
                },
              },
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error fetching user-host conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, recipientId, attachments } = await request.json();
    const senderId = session.user.id;
    const senderRole = session.user.role;

    if (!recipientId) {
      return NextResponse.json(
        { error: "Recipient ID is required" },
        { status: 400 }
      );
    }


    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: "Content or attachments are required" },
        { status: 400 }
      );
    }

    const recipient = await db.user.findUnique({
      where: { id: recipientId },
      select: { id: true, role: true },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    const validRoles = ["USER", "HOST"];
    if (
      !validRoles.includes(senderRole) ||
      !validRoles.includes(recipient.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      (senderRole === "USER" && recipient.role !== "HOST") ||
      (senderRole === "HOST" && recipient.role !== "USER")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let conversation;

    if (senderRole === "USER") {
      conversation = await db.userHostConversation.upsert({
        where: {
          userId_hostId: {
            userId: senderId,
            hostId: recipientId,
          },
        },
        update: {
          updatedAt: new Date(),
        },
        create: {
          userId: senderId,
          hostId: recipientId,
        },
      });
    } else {
      conversation = await db.userHostConversation.upsert({
        where: {
          userId_hostId: {
            userId: recipientId,
            hostId: senderId,
          },
        },
        update: {
          updatedAt: new Date(),
        },
        create: {
          userId: recipientId,
          hostId: senderId,
        },
      });
    }

    // Create message with attachments
    const message = await db.userHostMessage.create({
      data: {
        content:
          content ||
          (attachments && attachments.length > 0 ? "📎 Attachment" : ""),
        senderId,
        conversationId: conversation.id,
        attachments: attachments || null,
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
    });

    // Broadcast the new message to connected clients
    const recipientIds = [conversation.userId, conversation.hostId].filter(
      (id) => id !== senderId
    );
    recipientIds.forEach((recipientId) => {
      broadcastMessage(
        {
          type: "new_message",
          message: {
            ...message,
            conversationId: conversation.id,
          },
          timestamp: Date.now(),
        },
        recipientId,
        "user-host"
      );
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error sending user-host message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
