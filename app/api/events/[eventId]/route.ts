import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Get event details by ID
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

    const event = await db.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        startDate: true,
        location: true,
        city: true,
        landmark: true,
        streetAddress: true,
        coverImage: true,
        host: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
