import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createImpersonationToken,
  logImpersonationEvent,
} from "@/lib/impersonation";
import { hash } from "bcryptjs";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetUserIdOrEmail, reason, expiresInMinutes } = body;

    if (!targetUserIdOrEmail) {
      return NextResponse.json(
        { error: "targetUserIdOrEmail is required" },
        { status: 400 }
      );
    }

    // Look up target user by ID or email
    const targetUser = await db.user.findFirst({
      where: {
        OR: [
          { id: targetUserIdOrEmail },
          { email: targetUserIdOrEmail.toLowerCase() },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // Prevent impersonating other admins (unless explicitly needed)
    if (targetUser.role === "ADMIN" && targetUser.id !== session.user.id) {
      return NextResponse.json(
        { error: "Cannot impersonate other admin users" },
        { status: 403 }
      );
    }

    // Get client IP and user agent
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Generate a temporary password for impersonation
    const tempPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await hash(tempPassword, 10);

    // Calculate expiry time
    const expiresIn = expiresInMinutes ? parseInt(expiresInMinutes) : 15;
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);

    // Store the original password and set temporary password
    const user = await db.user.update({
      where: { id: targetUser.id },
      data: {
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Create impersonation token for tracking
    const token = await createImpersonationToken({
      adminId: session.user.id,
      adminName: session.user.name,
      adminEmail: session.user.email,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      targetUserEmail: targetUser.email,
      reason: reason || undefined,
      ip,
      expiresInMinutes: expiresIn,
    });

    // Log the impersonation start
    await logImpersonationEvent({
      action: "START",
      adminId: session.user.id,
      adminName: session.user.name,
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      reason: reason || undefined,
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        password: tempPassword,
        expiresAt: expiresAt.toISOString(),
        expiresInMinutes: expiresIn,
        token,
      },
    });
  } catch (error) {
    console.error("Error starting impersonation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
