import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { validateReferrerCode } from "@/lib/actions/referrer-code";
import { getImpersonationFromRequest } from "./impersonation";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function auth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token || !token.value) {
      return null;
    }

    let decoded;
    try {
      decoded = verify(token.value, JWT_SECRET) as { userId: string };
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return null;
    }

    if (!decoded.userId) {
      return null;
    }

    // Check if impersonation is active
    const impersonation = await getImpersonationFromRequest();

    let userId = decoded.userId;

    // If impersonation is active, use the target user ID instead
    if (impersonation) {
      userId = impersonation.actingUserId;
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        walletBalance: true,
        referralCode: true,
        referredBy: true,
        referredByHostId: true,
        createdAt: true,
        hostFeePercentage: true,
      },
    });

    if (!user) {
      return null;
    }

    // Return user with impersonation context if active
    return {
      user,
      impersonation: impersonation
        ? {
            impersonatorId: impersonation.impersonatorId,
            impersonatorName: impersonation.impersonatorName,
            impersonatorEmail: impersonation.impersonatorEmail,
            reason: impersonation.reason,
          }
        : null,
    };
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

// Function to handle signup with referrer code
export async function handleReferrerSignup(
  userData: any,
  referrerCode?: string
) {
  try {
    // If no referrer code or user is not a REFERRER, proceed with normal signup
    if (!referrerCode || userData.role !== UserRole.REFERRER) {
      return {
        success: true,
        userData,
      };
    }

    // Validate the referrer code
    const validation = await validateReferrerCode(referrerCode);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || "Invalid referrer code",
      };
    }

    // Associate the REFERRER with the HOST who created the code
    return {
      success: true,
      userData: {
        ...userData,
        referredByHostId: validation.hostId,
      },
    };
  } catch (error) {
    console.error("Error handling referrer signup:", error);
    return {
      success: false,
      error: "Failed to process referrer code",
    };
  }
}
