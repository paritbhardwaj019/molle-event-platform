import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendAdminPushNotification } from "@/lib/actions/notifications";
import type { AdminPushNotificationData } from "@/lib/actions/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, message, imageUrl, linkUrl, targetAudience } = body;

    if (!title || !message || !targetAudience) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title, message, targetAudience",
        },
        { status: 400 }
      );
    }

    const validAudiences = ["ALL", "HOST", "USER", "REFERRER"];
    if (!validAudiences.includes(targetAudience)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid target audience. Must be one of: ALL, HOST, USER, REFERRER",
        },
        { status: 400 }
      );
    }

    const notificationData: AdminPushNotificationData = {
      title: title.trim(),
      message: message.trim(),
      imageUrl: imageUrl?.trim() || undefined,
      linkUrl: linkUrl?.trim() || undefined,
      targetAudience,
    };

    const result = await sendAdminPushNotification(notificationData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error sending admin push notification:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
