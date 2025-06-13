import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    let conversations;

    if (userRole === "ADMIN") {
      // Admin can see all conversations
      conversations = await db.conversation.findMany({
        where: {
          adminId: userId,
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
      // Host can only see their conversation with admin
      const adminUser = await db.user.findFirst({
        where: { role: "ADMIN" },
      });

      if (!adminUser) {
        return NextResponse.json({ conversations: [] });
      }

      conversations = await db.conversation.findMany({
        where: {
          hostId: userId,
          adminId: adminUser.id,
        },
        include: {
          admin: {
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
      });
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
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

    const { content, recipientId } = await request.json();
    const senderId = session.user.id;
    const senderRole = session.user.role;

    if (!content || !recipientId) {
      return NextResponse.json(
        { error: "Content and recipient ID are required" },
        { status: 400 }
      );
    }

    // Validate that the conversation is between admin and host
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

    const validRoles = ["ADMIN", "HOST"];
    if (
      !validRoles.includes(senderRole) ||
      !validRoles.includes(recipient.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure conversation is between admin and host only
    if (
      (senderRole === "HOST" && recipient.role !== "ADMIN") ||
      (senderRole === "ADMIN" && recipient.role !== "HOST")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find or create conversation
    let conversation;
    if (senderRole === "HOST") {
      conversation = await db.conversation.upsert({
        where: {
          hostId_adminId: {
            hostId: senderId,
            adminId: recipientId,
          },
        },
        update: {
          updatedAt: new Date(),
        },
        create: {
          hostId: senderId,
          adminId: recipientId,
        },
      });
    } else {
      conversation = await db.conversation.upsert({
        where: {
          hostId_adminId: {
            hostId: recipientId,
            adminId: senderId,
          },
        },
        update: {
          updatedAt: new Date(),
        },
        create: {
          hostId: recipientId,
          adminId: senderId,
        },
      });
    }

    // Create message
    const message = await db.message.create({
      data: {
        content,
        senderId,
        conversationId: conversation.id,
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

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
