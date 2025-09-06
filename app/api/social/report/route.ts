import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const reportSchema = z.object({
  reportedUserId: z.string(),
  type: z.enum([
    "INAPPROPRIATE_CONTENT",
    "HARASSMENT",
    "FAKE_PROFILE",
    "SPAM",
    "SAFETY_CONCERN",
    "OTHER",
  ]),
  reason: z.string().min(1, "Reason is required"),
  description: z.string().max(1000).optional(),
  matchId: z.string().optional(),
  messageId: z.string().optional(),
});

// POST - Report a user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reportedUserId, type, reason, description, matchId, messageId } =
      reportSchema.parse(body);

    // Check if user is trying to report themselves
    if (reportedUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot report yourself" },
        { status: 400 }
      );
    }

    // Check if user exists
    const reportedUser = await db.user.findUnique({
      where: { id: reportedUserId },
      select: { id: true, name: true },
    });

    if (!reportedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already reported by this user
    const existingReport = await db.socialReport.findFirst({
      where: {
        reporterId: session.user.id,
        reportedId: reportedUserId,
        status: { in: ["PENDING", "REVIEWED"] },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this user" },
        { status: 400 }
      );
    }

    // Create report
    const report = await db.socialReport.create({
      data: {
        reporterId: session.user.id,
        reportedId: reportedUserId,
        type,
        reason,
        description,
        matchId,
        messageId,
        status: "PENDING",
      },
      include: {
        reported: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Auto-block user for serious offenses
    const seriousOffenses = ["HARASSMENT", "SAFETY_CONCERN"];
    if (seriousOffenses.includes(type)) {
      // Check if block already exists
      const existingBlock = await db.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: session.user.id,
            blockedId: reportedUserId,
          },
        },
      });

      if (!existingBlock) {
        await db.block.create({
          data: {
            blockerId: session.user.id,
            blockedId: reportedUserId,
            reason: `Auto-blocked due to ${type
              .toLowerCase()
              .replace("_", " ")} report`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        autoBlocked: seriousOffenses.includes(type),
      },
      message:
        "Report submitted successfully. Thank you for helping keep our community safe.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid report data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
