import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    let unreadCount = 0;

    if (userRole === "USER") {
      // Count unread messages from hosts
      unreadCount = await db.userHostMessage.count({
        where: {
          isRead: false,
          senderId: {
            not: userId,
          },
          conversation: {
            userId: userId,
          },
        },
      });
    } else if (userRole === "HOST") {
      // Count unread messages from users
      unreadCount = await db.userHostMessage.count({
        where: {
          isRead: false,
          senderId: {
            not: userId,
          },
          conversation: {
            hostId: userId,
          },
        },
      });
    }

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching user-host unread count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
