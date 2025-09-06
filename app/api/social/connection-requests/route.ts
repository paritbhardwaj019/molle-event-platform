import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const connectionRequestSchema = z.object({
  receiverId: z.string(),
  eventId: z.string(),
  message: z.string().max(500).optional(),
});

const responseSchema = z.object({
  requestId: z.string(),
  action: z.enum(["ACCEPT", "REJECT"]),
});

// GET - Get connection requests (sent and received)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "received"; // "sent" or "received"
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const whereClause =
      type === "sent"
        ? { senderId: session.user.id }
        : { receiverId: session.user.id };

    const requests = await db.connectionRequest.findMany({
      where: {
        ...whereClause,
        expiresAt: { gt: new Date() }, // Only non-expired requests
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
            birthday: true,
            userPreferences: {
              select: {
                bio: true,
                interests: true,
                photos: true,
                connectionTypes: true,
                showAge: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            birthday: true,
            userPreferences: {
              select: {
                bio: true,
                interests: true,
                photos: true,
                connectionTypes: true,
                showAge: true,
              },
            },
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            coverImage: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const formattedRequests = requests.map((request) => {
      const otherUser = type === "sent" ? request.receiver : request.sender;
      const age =
        otherUser.birthday && otherUser.userPreferences?.showAge
          ? Math.floor(
              (new Date().getTime() - new Date(otherUser.birthday).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : null;

      return {
        id: request.id,
        status: request.status,
        message: request.message,
        createdAt: request.createdAt,
        expiresAt: request.expiresAt,
        event: request.event,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          age: age,
          bio: otherUser.userPreferences?.bio,
          interests: otherUser.userPreferences?.interests || [],
          photos: otherUser.userPreferences?.photos || [],
          connectionTypes: otherUser.userPreferences?.connectionTypes || [],
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedRequests,
      pagination: {
        limit,
        offset,
        hasMore: formattedRequests.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching connection requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Send connection request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, eventId, message } =
      connectionRequestSchema.parse(body);

    // Check if trying to send request to self
    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot send request to yourself" },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const [senderAttendee, receiverAttendee] = await Promise.all([
      db.ticket.findFirst({
        where: {
          userId: session.user.id,
          eventId: eventId,
        },
      }),
      db.ticket.findFirst({
        where: {
          userId: receiverId,
          eventId: eventId,
        },
      }),
    ]);

    if (!senderAttendee) {
      return NextResponse.json(
        {
          error: "You must be attending the event to send connection requests",
        },
        { status: 400 }
      );
    }

    if (!receiverAttendee) {
      return NextResponse.json(
        { error: "User is not attending this event" },
        { status: 400 }
      );
    }

    // Check if users are blocked
    const blockExists = await db.block.findFirst({
      where: {
        OR: [
          { blockerId: session.user.id, blockedId: receiverId },
          { blockerId: receiverId, blockedId: session.user.id },
        ],
      },
    });

    if (blockExists) {
      return NextResponse.json(
        { error: "Cannot send request to this user" },
        { status: 400 }
      );
    }

    // Check if request already exists
    const existingRequest = await db.connectionRequest.findUnique({
      where: {
        senderId_receiverId_eventId: {
          senderId: session.user.id,
          receiverId: receiverId,
          eventId: eventId,
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "Connection request already sent" },
        { status: 400 }
      );
    }

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create connection request
    const connectionRequest = await db.connectionRequest.create({
      data: {
        senderId: session.user.id,
        receiverId: receiverId,
        eventId: eventId,
        message: message,
        expiresAt: expiresAt,
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: connectionRequest,
      message: "Connection request sent",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error sending connection request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Respond to connection request
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, action } = responseSchema.parse(body);

    // Find the connection request
    const connectionRequest = await db.connectionRequest.findFirst({
      where: {
        id: requestId,
        receiverId: session.user.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!connectionRequest) {
      return NextResponse.json(
        { error: "Connection request not found or expired" },
        { status: 404 }
      );
    }

    // Update request status
    const updatedRequest = await db.connectionRequest.update({
      where: { id: requestId },
      data: { status: action === "ACCEPT" ? "ACCEPTED" : "REJECTED" },
    });

    // If accepted, create a match
    let match = null;
    if (action === "ACCEPT") {
      match = await db.match.create({
        data: {
          user1Id: connectionRequest.senderId,
          user2Id: session.user.id,
          status: "ACTIVE",
          matchedViaEvent: true,
          eventId: connectionRequest.eventId,
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
    }

    return NextResponse.json({
      success: true,
      data: {
        request: updatedRequest,
        match: match,
      },
      message:
        action === "ACCEPT"
          ? "Connection request accepted"
          : "Connection request rejected",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error responding to connection request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
