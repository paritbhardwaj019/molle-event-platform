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

    if (userRole === "ADMIN") {
      // Count unread messages from all hosts
      unreadCount = await db.message.count({
        where: {
          isRead: false,
          senderId: {
            not: userId,
          },
          conversation: {
            adminId: userId,
          },
        },
      });
    } else if (userRole === "HOST") {
      // Count unread messages from admin
      const adminUnreadCount = await db.message.count({
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

      // Count unread messages from users
      const userUnreadCount = await db.userHostMessage.count({
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

      unreadCount = adminUnreadCount + userUnreadCount;
    } else if (userRole === "USER") {
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
    }

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
