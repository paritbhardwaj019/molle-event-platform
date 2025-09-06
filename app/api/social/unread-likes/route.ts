import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has purchased at least one package
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        activePackage: true,
        subscriptionPayments: {
          where: {
            status: "COMPLETED",
          },
          include: {
            package: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has any completed subscription payments
    const hasPurchasedPackage = user.subscriptionPayments.length > 0;

    if (!hasPurchasedPackage) {
      return NextResponse.json(
        {
          error: "Premium feature - purchase a package to see who liked you",
          requiresUpgrade: true,
        },
        { status: 403 }
      );
    }

    // Get users who liked the current user but haven't been swiped on yet
    const unreadLikes = await db.swipe.findMany({
      where: {
        swipedId: session.user.id,
        action: "LIKE",
        swiper: {
          // Exclude users who have been swiped on by current user
          id: {
            notIn: (
              await db.swipe.findMany({
                where: { swiperId: session.user.id },
                select: { swipedId: true },
              })
            ).map((s) => s.swipedId),
          },
        },
      },
      include: {
        swiper: {
          include: {
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
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format the response
    const formattedLikes = unreadLikes.map((like) => ({
      id: like.id,
      createdAt: like.createdAt,
      user: {
        id: like.swiper.id,
        name: like.swiper.name,
        avatar: like.swiper.avatar,
        age: like.swiper.birthday
          ? new Date().getFullYear() -
            new Date(like.swiper.birthday).getFullYear()
          : undefined,
        bio: like.swiper.bio,
        interests: like.swiper.userPreferences?.interests || [],
        photos: like.swiper.userPreferences?.photos || [],
        connectionTypes: like.swiper.userPreferences?.connectionTypes || [],
        relationshipStatus: like.swiper.userPreferences?.relationshipStatus,
        showLocation: like.swiper.userPreferences?.showLocation,
        cityId: like.swiper.userPreferences?.cityId,
        // Add badge info if user has active package with badge
        hasBadge: like.swiper.activePackage?.allowBadge || false,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedLikes,
    });
  } catch (error) {
    console.error("Failed to fetch unread likes:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread likes" },
      { status: 500 }
    );
  }
}
