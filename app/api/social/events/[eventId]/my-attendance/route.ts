import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Get current user's attendance status for an event
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

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if user is attending this event
    const attendance = await db.eventAttendee.findUnique({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId: eventId,
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        isAttending: !!attendance,
        status: attendance?.status || null,
        joinedAt: attendance?.createdAt || null,
      },
    });
  } catch (error) {
    console.error("Error fetching user attendance status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
