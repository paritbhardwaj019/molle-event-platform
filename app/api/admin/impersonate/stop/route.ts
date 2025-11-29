import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  revokeImpersonationToken,
  logImpersonationEvent,
  getImpersonationTokenData,
} from "@/lib/impersonation";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Get the impersonation token data
    const impersonationData = getImpersonationTokenData(token);

    if (!impersonationData) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Revoke the token
    revokeImpersonationToken(token);

    // Log the impersonation stop action
    await logImpersonationEvent({
      action: "STOP",
      adminId: impersonationData.adminId,
      adminName: impersonationData.adminName,
      targetUserId: impersonationData.targetUserId,
      targetUserName: impersonationData.targetUserName,
      reason: impersonationData.reason,
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Impersonation stopped. Temporary password revoked.",
    });
  } catch (error) {
    console.error("Error stopping impersonation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
