import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const swipeSchema = z.object({
  swipedUserId: z.string(),
  action: z.enum(["LIKE", "PASS"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { swipedUserId, action } = swipeSchema.parse(body);

    // Check if user is trying to swipe on themselves
    if (swipedUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot swipe on yourself" },
        { status: 400 }
      );
    }

    // Get user's preferences
    const userPreferences = await db.userPreference.findUnique({
      where: { userId: session.user.id },
    });

    if (!userPreferences) {
      return NextResponse.json(
        { error: "User preferences not found" },
        { status: 400 }
      );
    }

    // Get user's subscription status
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        activePackage: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }

    // Check if user has active subscription
    const isSubscriptionActive =
      user.subscriptionEndDate && user.subscriptionEndDate > new Date();

    // If no active subscription, check free swipes
    if (!isSubscriptionActive) {
      if (user.freeSwipesRemaining <= 0) {
        return NextResponse.json(
          {
            error: "No active subscription and no free swipes remaining",
            canPurchaseMore: true,
          },
          { status: 403 }
        );
      }
    }

    // Check daily swipe limit based on subscription
    const today = new Date();
    const lastReset = new Date(user.lastSwipeReset);
    const isNewDay = today.toDateString() !== lastReset.toDateString();

    if (isNewDay) {
      // Reset daily swipes based on subscription package
      const dailyLimit = user.activePackage?.dailySwipeLimit || 0;
      await db.user.update({
        where: { id: session.user.id },
        data: {
          dailySwipeRemaining: dailyLimit,
          lastSwipeReset: today,
        },
      });
      user.dailySwipeRemaining = dailyLimit;
    } else if (user.dailySwipeRemaining <= 0) {
      // Check if user has free swipes available
      if (user.freeSwipesRemaining > 0) {
        // Allow using free swipes
      } else {
        return NextResponse.json(
          {
            error: "Daily swipe limit reached",
            canPurchaseMore: true,
            swipesUsed:
              (user.activePackage?.dailySwipeLimit || 0) -
              user.dailySwipeRemaining,
            dailyLimit: user.activePackage?.dailySwipeLimit || 0,
          },
          { status: 429 }
        );
      }
    }

    // Check if already swiped on this user
    const existingSwipe = await db.swipe.findUnique({
      where: {
        swiperId_swipedId: {
          swiperId: session.user.id,
          swipedId: swipedUserId,
        },
      },
    });

    if (existingSwipe) {
      return NextResponse.json(
        { error: "Already swiped on this user" },
        { status: 400 }
      );
    }

    // Check if users are blocked
    const blockExists = await db.block.findFirst({
      where: {
        OR: [
          { blockerId: session.user.id, blockedId: swipedUserId },
          { blockerId: swipedUserId, blockedId: session.user.id },
        ],
      },
    });

    if (blockExists) {
      return NextResponse.json(
        { error: "Cannot interact with this user" },
        { status: 400 }
      );
    }

    // Create the swipe record
    const swipe = await db.swipe.create({
      data: {
        swiperId: session.user.id,
        swipedId: swipedUserId,
        action: action,
      },
    });

    // Decrement remaining swipes (subscription or free swipes)
    if (isSubscriptionActive && user.dailySwipeRemaining > 0) {
      // Decrement subscription swipes
      await db.user.update({
        where: { id: session.user.id },
        data: {
          dailySwipeRemaining: { decrement: 1 },
        },
      });
    } else {
      // Decrement free swipes
      await db.user.update({
        where: { id: session.user.id },
        data: {
          freeSwipesRemaining: { decrement: 1 },
        },
      });
    }

    let isMatch = false;
    let matchId = null;

    // Check for mutual like (match)
    if (action === "LIKE") {
      const mutualSwipe = await db.swipe.findUnique({
        where: {
          swiperId_swipedId: {
            swiperId: swipedUserId,
            swipedId: session.user.id,
          },
        },
      });

      if (mutualSwipe && mutualSwipe.action === "LIKE") {
        // Create a match
        const match = await db.match.create({
          data: {
            user1Id: session.user.id,
            user2Id: swipedUserId,
            status: "ACTIVE",
            matchedViaEvent: false,
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

        isMatch = true;
        matchId = match.id;
      }
    }

    // Get updated user info
    const updatedUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        dailySwipeRemaining: true,
        freeSwipesRemaining: true,
        activePackage: {
          select: {
            dailySwipeLimit: true,
          },
        },
      },
    });

    const isActiveSubscription =
      user.subscriptionEndDate && user.subscriptionEndDate > new Date();
    const totalRemaining = isActiveSubscription
      ? (updatedUser?.dailySwipeRemaining || 0) +
        (updatedUser?.freeSwipesRemaining || 0)
      : updatedUser?.freeSwipesRemaining || 0;

    return NextResponse.json({
      success: true,
      data: {
        swipeId: swipe.id,
        isMatch,
        matchId,
        swipeInfo: {
          swipesUsed: isActiveSubscription
            ? (updatedUser?.activePackage?.dailySwipeLimit || 0) -
              (updatedUser?.dailySwipeRemaining || 0)
            : 3 - (updatedUser?.freeSwipesRemaining || 0),
          dailyLimit: updatedUser?.activePackage?.dailySwipeLimit || 0,
          remaining: totalRemaining,
          freeSwipesRemaining: updatedUser?.freeSwipesRemaining || 0,
          hasActiveSubscription: isActiveSubscription,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error processing swipe:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
