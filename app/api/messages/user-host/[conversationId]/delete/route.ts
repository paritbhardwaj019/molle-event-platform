import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    // Check if conversation exists and user has access to it
    const conversation = await db.userHostConversation.findUnique({
      where: {
        id: conversationId,
        OR: [{ userId: session.user.id }, { hostId: session.user.id }],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Delete the conversation (messages will be deleted due to cascade)
    await db.userHostConversation.delete({
      where: {
        id: conversationId,
      },
    });

    return NextResponse.json(
      { success: true, message: "Conversation deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
