import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { reason } = await request.json();
    const userId = session.user.id;

    if (!reason) {
      return NextResponse.json(
        { error: "Report reason is required" },
        { status: 400 }
      );
    }

    // Find the conversation and verify user has access
    const conversation = await db.userHostConversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        userId: true,
        hostId: true,
        reportedBy: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify user is part of this conversation
    if (conversation.userId !== userId && conversation.hostId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if already reported
    if (conversation.reportedBy) {
      return NextResponse.json(
        { error: "Conversation already reported" },
        { status: 400 }
      );
    }

    // Report the conversation
    await db.userHostConversation.update({
      where: { id: conversationId },
      data: {
        reportedBy: userId,
        reportReason: reason,
        reportTimestamp: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reporting conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
