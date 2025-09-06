import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user's matches
    const matches = await db.match.findMany({
      where: {
        OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
        status: "ACTIVE",
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            avatar: true,
            birthday: true,
            role: true,
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
                showAge: true,
              },
            },
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            avatar: true,
            birthday: true,
            role: true,
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
                showAge: true,
              },
            },
          },
        },
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                content: true,
                createdAt: true,
                senderId: true,
                isRead: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Format matches data
    const formattedMatches = matches.map((match) => {
      const otherUser =
        match.user1Id === session.user.id ? match.user2 : match.user1;
      const lastMessage = match.conversation?.messages[0];

      // Calculate age if birthday is available and user allows showing age
      const age =
        otherUser.birthday && otherUser.userPreferences?.showAge
          ? Math.floor(
              (new Date().getTime() - new Date(otherUser.birthday).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : null;

      return {
        id: match.id,
        conversationId: match.conversationId,
        matchedAt: match.createdAt,
        matchedViaEvent: match.matchedViaEvent,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          avatar: otherUser.avatar,
          age: age,
          role: otherUser.role,
          bio: otherUser.userPreferences?.bio,
          interests: otherUser.userPreferences?.interests || [],
          photos: otherUser.userPreferences?.photos || [],
          connectionTypes: otherUser.userPreferences?.connectionTypes || [],
          hasBadge: otherUser.activePackage?.allowBadge || false,
        },
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              isFromMe: lastMessage.senderId === session.user.id,
              isRead: lastMessage.isRead,
            }
          : null,
        hasUnreadMessages: lastMessage
          ? !lastMessage.isRead && lastMessage.senderId !== session.user.id
          : false,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedMatches,
      pagination: {
        limit,
        offset,
        hasMore: formattedMatches.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Unmatch a user
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("matchId");

    if (!matchId) {
      return NextResponse.json(
        { error: "Match ID is required" },
        { status: 400 }
      );
    }

    // Find the match and verify user is part of it
    const match = await db.match.findFirst({
      where: {
        id: matchId,
        OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Update match status to unmatched
    await db.match.update({
      where: { id: matchId },
      data: { status: "UNMATCHED" },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully unmatched",
    });
  } catch (error) {
    console.error("Error unmatching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
