import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "USER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user's basic stats
    const [
      totalBookings,
      totalLikesReceived,
      totalLikesGiven,
      totalMatches,
      kycStatus,
    ] = await Promise.all([
      // Total bookings
      db.booking.count({
        where: { userId: session.user.id },
      }),

      // Total likes received
      db.like.count({
        where: { likedId: session.user.id },
      }),

      // Total likes given
      db.like.count({
        where: { likerId: session.user.id },
      }),

      // Total matches
      db.match.count({
        where: {
          OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
          status: "ACTIVE",
        },
      }),

      // KYC status
      db.datingKycRequest.findUnique({
        where: { userId: session.user.id },
        select: { status: true },
      }),
    ]);

    // Check if user has premium subscription
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { activePackage: true },
    });

    const isPremium = user?.activePackage !== null;

    const metrics = {
      totalBookings,
      totalLikesReceived,
      totalLikesGiven,
      totalMatches,
      kycStatus: kycStatus?.status || "NOT_STARTED",
      isPremium,
      subscriptionInfo: user?.activePackage
        ? {
            name: user.activePackage.name,
            dailySwipeLimit: user.activePackage.dailySwipeLimit,
            dailySwipeRemaining: user.dailySwipeRemaining,
            freeSwipesRemaining: user.freeSwipesRemaining,
            subscriptionEndDate: user.subscriptionEndDate,
          }
        : null,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("User metrics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
