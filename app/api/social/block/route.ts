import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const blockSchema = z.object({
  blockedUserId: z.string(),
  reason: z.string().max(500).optional(),
});

const unblockSchema = z.object({
  blockedUserId: z.string(),
});

// POST - Block a user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { blockedUserId, reason } = blockSchema.parse(body);

    // Check if user is trying to block themselves
    if (blockedUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot block yourself" },
        { status: 400 }
      );
    }

    // Check if user exists
    const userToBlock = await db.user.findUnique({
      where: { id: blockedUserId },
      select: { id: true, name: true },
    });

    if (!userToBlock) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already blocked
    const existingBlock = await db.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: blockedUserId,
        },
      },
    });

    if (existingBlock) {
      return NextResponse.json(
        { error: "User is already blocked" },
        { status: 400 }
      );
    }

    // Create block
    const block = await db.block.create({
      data: {
        blockerId: session.user.id,
        blockedId: blockedUserId,
        reason,
      },
    });

    // Remove any existing matches between these users
    await db.match.updateMany({
      where: {
        OR: [
          { user1Id: session.user.id, user2Id: blockedUserId },
          { user1Id: blockedUserId, user2Id: session.user.id },
        ],
      },
      data: { status: "BLOCKED" },
    });

    return NextResponse.json({
      success: true,
      data: block,
      message: "User blocked successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error blocking user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Unblock a user
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blockedUserId = searchParams.get("blockedUserId");

    if (!blockedUserId) {
      return NextResponse.json(
        { error: "blockedUserId is required" },
        { status: 400 }
      );
    }

    // Find and delete the block
    const existingBlock = await db.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: blockedUserId,
        },
      },
    });

    if (!existingBlock) {
      return NextResponse.json(
        { error: "User is not blocked" },
        { status: 404 }
      );
    }

    await db.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: blockedUserId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "User unblocked successfully",
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Get list of blocked users
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const blocks = await db.block.findMany({
      where: { blockerId: session.user.id },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      success: true,
      data: blocks.map((block) => ({
        id: block.id,
        reason: block.reason,
        createdAt: block.createdAt,
        user: block.blocked,
      })),
      pagination: {
        limit,
        offset,
        hasMore: blocks.length === limit,
      },
    });
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
