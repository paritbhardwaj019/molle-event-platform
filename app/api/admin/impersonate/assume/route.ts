import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getImpersonationTokenData,
  logImpersonationEvent,
} from "@/lib/impersonation";

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Validate token
    const tokenData = getImpersonationTokenData(token);

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Ensure the token belongs to the current admin
    if (tokenData.adminId !== session.user.id) {
      return NextResponse.json(
        { error: "Token does not belong to current admin" },
        { status: 403 }
      );
    }

    // Get client IP and user agent
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Log the impersonation assume action
    await logImpersonationEvent({
      action: "ASSUME",
      adminId: session.user.id,
      adminName: session.user.name,
      targetUserId: tokenData.targetUserId,
      targetUserName: tokenData.targetUserName,
      reason: tokenData.reason,
      ip,
      userAgent,
    });

    // Create response
    const response = NextResponse.json({
      success: true,
      message: "Impersonation started",
      data: {
        targetUserId: tokenData.targetUserId,
        targetUserName: tokenData.targetUserName,
        expiresAt: new Date(tokenData.expiresAt).toISOString(),
      },
    });

    // Set secure httpOnly cookie with the impersonation token
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = [
      `impersonation-token=${token}`,
      "HttpOnly",
      "SameSite=Strict",
      "Path=/",
      `Max-Age=${Math.floor((tokenData.expiresAt - Date.now()) / 1000)}`,
    ];

    if (isProduction) {
      cookieOptions.push("Secure");
    }

    response.headers.set("Set-Cookie", cookieOptions.join("; "));

    return response;
  } catch (error) {
    console.error("Error assuming impersonation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
