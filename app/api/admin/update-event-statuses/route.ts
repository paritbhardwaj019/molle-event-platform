import { NextRequest, NextResponse } from "next/server";
import { updateEventStatuses } from "@/lib/actions/event";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Update event statuses
    const result = await updateEventStatuses();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully updated ${result.data.updatedCount} events`,
        data: result.data,
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in update-event-statuses API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // Get events that need status updates (read-only)
    const now = new Date();

    const eventsNeedingUpdate = await db.event.findMany({
      where: {
        OR: [
          {
            endDate: {
              lt: now,
            },
            status: {
              notIn: ["EXPIRED", "CANCELLED", "COMPLETED"],
            },
          },
          {
            soldTickets: {
              gte: Prisma.raw('"maxTickets"'),
            },
            status: {
              notIn: ["FULL_HOUSE", "CANCELLED", "COMPLETED", "EXPIRED"],
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        maxTickets: true,
        soldTickets: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        eventsNeedingUpdate: eventsNeedingUpdate.length,
        events: eventsNeedingUpdate,
      },
    });
  } catch (error) {
    console.error("Error in update-event-statuses GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
