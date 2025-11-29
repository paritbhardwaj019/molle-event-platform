import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getImpersonationFromRequest } from "@/lib/impersonation";

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if impersonation is active
    const impersonation = await getImpersonationFromRequest();

    if (!impersonation) {
      return NextResponse.json({
        active: false,
      });
    }

    return NextResponse.json({
      active: true,
      targetUserId: impersonation.actingUserId,
      impersonatorId: impersonation.impersonatorId,
      impersonatorName: impersonation.impersonatorName,
    });
  } catch (error) {
    console.error("Error checking impersonation status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
