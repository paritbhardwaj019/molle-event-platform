"use server";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const preferenceSchema = z.object({
  cityId: z.string().optional(),
  maxDistance: z.number().min(1).max(500).optional(),
  connectionTypes: z
    .array(z.enum(["FRIENDS", "DATING", "NETWORKING", "HANGOUT"]))
    .optional(),
  relationshipStatus: z
    .enum(["SINGLE", "TAKEN", "COMPLICATED", "PREFER_NOT_TO_SAY"])
    .nullable()
    .optional()
    .transform((val) => (val === null ? undefined : val)),
  ageRange: z
    .object({
      min: z.number().min(18).max(99),
      max: z.number().min(18).max(99),
    })
    .nullable()
    .optional()
    .transform((val) => (val === null ? undefined : val)),
  interests: z.array(z.string()).optional(),
  photos: z.array(z.string()).optional(),
  showAge: z.boolean().optional(),
  showLocation: z.boolean().optional(),
  discoverable: z.boolean().optional(),
  bio: z.string().max(500).optional(),
  age: z.number().min(18).max(100).optional(),
  gender: z
    .enum(["MALE", "FEMALE", "NON_BINARY", "PREFER_NOT_TO_SAY"])
    .optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await db.userPreference.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            birthday: true,
          },
        },
      },
    });

    if (!preferences) {
      const defaultPreferences = await db.userPreference.create({
        data: {
          userId: session.user.id,
          connectionTypes: ["FRIENDS"],
          dailySwipeLimit: 20,
          swipesUsedToday: 0,
          lastSwipeReset: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              birthday: true,
            },
          },
        },
      });
      return NextResponse.json({ success: true, data: defaultPreferences });
    }

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validatedData = preferenceSchema.parse(body);

    if (
      validatedData.ageRange &&
      validatedData.ageRange.min > validatedData.ageRange.max
    ) {
      return NextResponse.json(
        { error: "Minimum age cannot be greater than maximum age" },
        { status: 400 }
      );
    }

    const preferences = await db.userPreference.upsert({
      where: { userId: session.user.id },
      update: validatedData,
      create: {
        userId: session.user.id,
        ...validatedData,
        dailySwipeLimit: 20,
        swipesUsedToday: 0,
        lastSwipeReset: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            birthday: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: preferences });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors);
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all related social data without using transactions
    // Delete social conversations and messages first (due to foreign key constraints)
    const conversations = await db.socialConversation.findMany({
      where: {
        match: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      },
      select: { id: true },
    });

    if (conversations.length > 0) {
      const conversationIds = conversations.map((c) => c.id);

      // Delete messages first
      await db.socialMessage.deleteMany({
        where: {
          conversationId: {
            in: conversationIds,
          },
        },
      });

      // Delete conversations
      await db.socialConversation.deleteMany({
        where: {
          id: {
            in: conversationIds,
          },
        },
      });
    }

    // Delete matches
    await db.match.deleteMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    });

    // Delete likes (both sent and received)
    await db.like.deleteMany({
      where: {
        OR: [{ likerId: userId }, { likedId: userId }],
      },
    });

    // Delete swipes (both sent and received)
    await db.swipe.deleteMany({
      where: {
        OR: [{ swiperId: userId }, { swipedId: userId }],
      },
    });

    // Delete social reports
    await db.socialReport.deleteMany({
      where: {
        OR: [{ reporterId: userId }, { reportedId: userId }],
      },
    });

    // Delete blocks
    await db.block.deleteMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
    });

    // Delete user preferences
    await db.userPreference.delete({
      where: { userId },
    });

    // Reset user's social-related fields
    await db.user.update({
      where: { id: userId },
      data: {
        dailySwipeRemaining: 0,
        freeSwipesRemaining: 3,
        lastSwipeReset: new Date(),
        activePackageId: null,
        subscriptionEndDate: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Swipe profile deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting swipe profile:", error);
    return NextResponse.json(
      { error: "Failed to delete swipe profile. Please try again later." },
      { status: 500 }
    );
  }
}
