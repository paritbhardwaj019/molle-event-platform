import { NextRequest, NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/firebase-admin";
import { getUserFCMTokens } from "@/lib/actions/fcm-tokens";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // const session = await auth();
    // if (!session?.user?.id || session.user.role !== "ADMIN") {
    // return NextResponse.json(
    //   { success: false, error: "Unauthorized" },
    //   { status: 401 }
    // );
    // }

    const body = await request.json();
    const { userId, title, body: messageBody, data, imageUrl } = body;

    if (!userId || !title || !messageBody) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: userId, title, body",
        },
        { status: 400 }
      );
    }

    const tokens = await getUserFCMTokens(userId);
    if (tokens.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active FCM tokens found for user" },
        { status: 404 }
      );
    }

    // Send notification to all user's devices
    const results = await Promise.allSettled(
      tokens.map((token) =>
        sendPushNotification({
          token,
          title,
          body: messageBody,
          data,
          imageUrl,
        })
      )
    );

    const successful = results.filter(
      (result) => result.status === "fulfilled" && result.value.success
    ).length;

    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      totalTokens: tokens.length,
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
