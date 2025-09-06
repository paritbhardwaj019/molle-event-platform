import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface UserMatch {
  id: string;
  name: string;
  avatar?: string | null;
  birthday?: Date | null;
  gender?: string | null; // User's actual gender from user model
  activePackage?: {
    allowBadge: boolean;
  } | null;
  userPreferences?: {
    bio?: string | null;
    interests: string[];
    photos: string[];
    connectionTypes: string[];
    relationshipStatus?: string | null;
    showAge: boolean;
    showLocation: boolean;
    cityId?: string | null;
    gender?: string | null; // Gender preference from userPreferences
  } | null;
  interestScore: number;
  likeCount: number;
}

function calculateInterestScore(
  userInterests: string[],
  matchInterests: string[]
): number {
  if (!userInterests.length || !matchInterests.length) return 0;

  const sharedInterests = userInterests.filter((interest) =>
    matchInterests.includes(interest)
  );

  // Base score from shared interests (0-100)
  const sharedRatio =
    sharedInterests.length /
    Math.max(userInterests.length, matchInterests.length);
  const baseScore = sharedRatio * 100;

  // Bonus for having many shared interests
  const sharedBonus = Math.min(sharedInterests.length * 10, 50);

  // Small penalty for too many interests (suggests less focus)
  const totalInterests = userInterests.length + matchInterests.length;
  const focusPenalty = totalInterests > 20 ? 10 : 0;

  return Math.min(100, Math.max(0, baseScore + sharedBonus - focusPenalty));
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const [userPreferences, currentUser] = await Promise.all([
      db.userPreference.findUnique({
        where: { userId: session.user.id },
      }),
      db.user.findUnique({
        where: { id: session.user.id },
        select: { birthday: true, gender: true },
      }),
    ]);

    if (!userPreferences || !userPreferences.discoverable) {
      return NextResponse.json(
        { error: "User not set up for discovery" },
        { status: 400 }
      );
    }

    const today = new Date();
    const lastReset = new Date(userPreferences.lastSwipeReset);
    const isNewDay = today.toDateString() !== lastReset.toDateString();

    if (isNewDay) {
      // Reset daily swipes
      await db.userPreference.update({
        where: { userId: session.user.id },
        data: {
          swipesUsedToday: 0,
          lastSwipeReset: today,
        },
      });
    } else if (userPreferences.swipesUsedToday >= 3) {
      return NextResponse.json(
        {
          error: "Daily swipe limit reached",
          canPurchaseMore: true,
          swipesUsed: userPreferences.swipesUsedToday,
          dailyLimit: 3,
        },
        { status: 429 }
      );
    }

    // Get users already swiped on
    const swipedUserIds = await db.swipe.findMany({
      where: { swiperId: session.user.id },
      select: { swipedId: true },
    });

    // Get blocked users
    const blockedUserIds = await db.block.findMany({
      where: {
        OR: [{ blockerId: session.user.id }, { blockedId: session.user.id }],
      },
      select: { blockerId: true, blockedId: true },
    });

    const excludedUserIds = [
      session.user.id,
      ...swipedUserIds.map((s) => s.swipedId),
      ...blockedUserIds.map((b) => b.blockerId),
      ...blockedUserIds.map((b) => b.blockedId),
    ];

    // Calculate user's age for filtering
    const userAge = currentUser?.birthday
      ? Math.floor(
          (today.getTime() - new Date(currentUser.birthday).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : null;

    // Build where clause for potential matches
    const whereClause: any = {
      id: { notIn: excludedUserIds },
      userPreferences: {
        discoverable: true,
        cityId: userPreferences.cityId || undefined,
      },
    };

    // Add age filtering if user has birthday
    if (userAge && userPreferences.ageRange) {
      const ageRange = userPreferences.ageRange as { min: number; max: number };
      const minBirthDate = new Date();
      minBirthDate.setFullYear(minBirthDate.getFullYear() - ageRange.max - 1);
      const maxBirthDate = new Date();
      maxBirthDate.setFullYear(maxBirthDate.getFullYear() - ageRange.min);

      whereClause.birthday = {
        gte: minBirthDate,
        lte: maxBirthDate,
      };
    }

    // Find potential matches - get more than needed for scoring
    const potentialMatches = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        avatar: true,
        birthday: true,
        gender: true, // Get user's actual gender from user model
        activePackage: {
          select: {
            allowBadge: true,
          },
        },
        userPreferences: {
          select: {
            bio: true,
            interests: true,
            photos: true,
            connectionTypes: true,
            relationshipStatus: true,
            showAge: true,
            showLocation: true,
            cityId: true,
            gender: true, // Keep gender preference from userPreferences
          },
        },

        _count: {
          select: {
            receivedSwipes: {
              where: {
                action: "LIKE",
              },
            },
          },
        },
      },
      take: Math.min(limit * 3, 100),
      skip: offset,
      orderBy: { createdAt: "desc" },
    });

    const userInterests = userPreferences.interests || [];
    const scoredMatches: UserMatch[] = potentialMatches
      .filter((user) => {
        if (!user.userPreferences) return false;

        const userConnectionTypes = userPreferences.connectionTypes || [];
        const matchConnectionTypes = user.userPreferences.connectionTypes || [];

        // Check if there's any overlap in connection types
        const hasConnectionTypeOverlap = userConnectionTypes.some((type) =>
          matchConnectionTypes.includes(type)
        );

        // Check gender preference if user has specified one
        if (userPreferences.gender && user.gender) {
          // Current user's gender preference should match other user's actual gender
          const currentUserPreferenceMatchesOtherUserGender =
            userPreferences.gender === user.gender;

          // Other user's gender preference should match current user's actual gender
          const otherUserPreferenceMatchesCurrentUserGender =
            !user.userPreferences?.gender ||
            (currentUser?.gender &&
              user.userPreferences.gender === currentUser.gender);

          return (
            hasConnectionTypeOverlap &&
            currentUserPreferenceMatchesOtherUserGender &&
            otherUserPreferenceMatchesCurrentUserGender
          );
        }

        return hasConnectionTypeOverlap;
      })
      .map((user) => ({
        ...user,
        avatar: user.avatar || undefined,
        interestScore: calculateInterestScore(
          userInterests,
          user.userPreferences?.interests || []
        ),
        likeCount: user._count.receivedSwipes,
      }));

    // Sort by like count (highest first), then by interest score (highest first)
    const topMatches = scoredMatches
      .sort((a, b) => {
        if (b.likeCount !== a.likeCount) {
          return b.likeCount - a.likeCount;
        }

        return b.interestScore - a.interestScore;
      })
      .slice(0, limit);

    const formattedMatches = topMatches.map((user) => {
      const age =
        user.birthday && user.userPreferences?.showAge
          ? Math.floor(
              (today.getTime() - new Date(user.birthday).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : null;

      const sharedInterests = userInterests.filter((interest) =>
        user.userPreferences?.interests.includes(interest)
      );

      return {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        age: age,
        bio: user.userPreferences?.bio,
        interests: user.userPreferences?.interests || [],
        photos: user.userPreferences?.photos || [],
        connectionTypes: user.userPreferences?.connectionTypes || [],
        relationshipStatus: user.userPreferences?.relationshipStatus,
        showLocation: user.userPreferences?.showLocation,
        cityId: user.userPreferences?.showLocation
          ? user.userPreferences?.cityId
          : null,
        interestScore: user.interestScore,
        sharedInterests: sharedInterests,
        likeCount: user.likeCount,
        hasBadge: user.activePackage?.allowBadge || false,
        gender: user.gender, // Use actual gender from user model
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedMatches,
      pagination: {
        limit,
        offset,
        hasMore: scoredMatches.length > limit,
      },
      swipeInfo: {
        swipesUsed: userPreferences.swipesUsedToday,
        dailyLimit: 3,
        remaining: 3 - userPreferences.swipesUsedToday,
      },
      matchQuality: {
        averageScore:
          formattedMatches.length > 0
            ? formattedMatches.reduce(
                (sum, user) => sum + user.interestScore,
                0
              ) / formattedMatches.length
            : 0,
        totalWithSharedInterests: formattedMatches.filter(
          (u) => u.sharedInterests.length > 0
        ).length,
      },
    });
  } catch (error) {
    console.error("Error discovering users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
