import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const attendeeSchema = z.object({
  status: z
    .enum(["INTERESTED", "GOING", "MAYBE"])
    .optional()
    .default("INTERESTED"),
});

// GET - Get event attendees
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user has purchased tickets for this event
    const booking = await db.booking.findFirst({
      where: {
        userId: session.user.id,
        eventId: eventId,
        status: "CONFIRMED",
      },
      include: {
        payment: true,
      },
    });

    const hasPurchasedTickets =
      !!booking && booking.payment?.status === "COMPLETED";

    if (!hasPurchasedTickets) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "Purchase tickets to see other attendees",
        requiresPurchase: true,
      });
    }

    // Get blocked users to exclude
    const blockedUserIds = await db.block.findMany({
      where: {
        OR: [{ blockerId: session.user.id }, { blockedId: session.user.id }],
      },
      select: { blockerId: true, blockedId: true },
    });

    const excludedUserIds = [
      session.user.id, // Exclude self
      ...blockedUserIds.map((b) => b.blockerId),
      ...blockedUserIds.map((b) => b.blockedId),
    ];

    // Get event attendees
    const attendees = await db.eventAttendee.findMany({
      where: {
        eventId: eventId,
        userId: { notIn: excludedUserIds },
        user: {
          userPreferences: {
            discoverable: true,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            birthday: true,
            userPreferences: {
              select: {
                bio: true,
                interests: true,
                connectionTypes: true,
                relationshipStatus: true,
                showAge: true,
                showLocation: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Check if current user has sent connection requests to any attendees
    const sentRequests = await db.connectionRequest.findMany({
      where: {
        senderId: session.user.id,
        eventId: eventId,
        receiverId: { in: attendees.map((a) => a.userId) },
      },
      select: { receiverId: true, status: true },
    });

    const requestStatusMap = sentRequests.reduce((acc, req) => {
      acc[req.receiverId] = req.status;
      return acc;
    }, {} as Record<string, string>);

    // Format attendees data
    const formattedAttendees = attendees.map((attendee) => {
      const age =
        attendee.user.birthday && attendee.user.userPreferences?.showAge
          ? Math.floor(
              (new Date().getTime() -
                new Date(attendee.user.birthday).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : null;

      return {
        id: attendee.id,
        status: attendee.status,
        joinedAt: attendee.createdAt,
        user: {
          id: attendee.user.id,
          name: attendee.user.name,
          avatar: attendee.user.avatar,
          age: age,
          bio: attendee.user.userPreferences?.bio,
          interests: attendee.user.userPreferences?.interests || [],
          connectionTypes: attendee.user.userPreferences?.connectionTypes || [],
          relationshipStatus: attendee.user.userPreferences?.relationshipStatus,
          showLocation: attendee.user.userPreferences?.showLocation,
        },
        connectionRequestStatus: requestStatusMap[attendee.userId] || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedAttendees,
      pagination: {
        limit,
        offset,
        hasMore: formattedAttendees.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching event attendees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Join event as attendee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const body = await request.json();
    const { status } = attendeeSchema.parse(body);

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, hostId: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user has purchased tickets for this event
    const booking = await db.booking.findFirst({
      where: {
        userId: session.user.id,
        eventId: eventId,
        status: "CONFIRMED",
      },
      include: {
        payment: true,
      },
    });

    const hasPurchasedTickets =
      !!booking && booking.payment?.status === "COMPLETED";

    if (!hasPurchasedTickets) {
      return NextResponse.json(
        {
          error: "You need to purchase tickets first to join this event",
        },
        { status: 403 }
      );
    }

    // Check if user is already an attendee
    const existingAttendee = await db.eventAttendee.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId,
        },
      },
    });

    if (existingAttendee) {
      // Update existing attendance status
      const updatedAttendee = await db.eventAttendee.update({
        where: { id: existingAttendee.id },
        data: { status },
      });

      return NextResponse.json({
        success: true,
        data: updatedAttendee,
        message: "Attendance status updated",
      });
    }

    // Create new attendee record
    const attendee = await db.eventAttendee.create({
      data: {
        userId: session.user.id,
        eventId: eventId,
        status: status,
      },
    });

    return NextResponse.json({
      success: true,
      data: attendee,
      message: "Successfully joined event",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error joining event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Leave event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    // Find and delete attendee record
    const attendee = await db.eventAttendee.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId,
        },
      },
    });

    if (!attendee) {
      return NextResponse.json(
        { error: "Not attending this event" },
        { status: 404 }
      );
    }

    await db.eventAttendee.delete({
      where: { id: attendee.id },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully left event",
    });
  } catch (error) {
    console.error("Error leaving event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
