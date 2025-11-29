import { cookies } from "next/headers";
import crypto from "crypto";

const impersonationTokens = new Map<
  string,
  {
    adminId: string;
    adminName: string;
    adminEmail: string;
    targetUserId: string;
    targetUserName: string;
    targetUserEmail: string;
    reason?: string;
    createdAt: number;
    expiresAt: number;
    ip?: string;
  }
>();

setInterval(
  () => {
    const now = Date.now();
    for (const [token, data] of impersonationTokens.entries()) {
      if (data.expiresAt < now) {
        impersonationTokens.delete(token);
      }
    }
  },
  5 * 60 * 1000
);

/**
 * Generate a cryptographically secure impersonation token
 */
export function generateImpersonationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create an impersonation token
 */
export async function createImpersonationToken(params: {
  adminId: string;
  adminName: string;
  adminEmail: string;
  targetUserId: string;
  targetUserName: string;
  targetUserEmail: string;
  reason?: string;
  ip?: string;
  expiresInMinutes?: number;
}): Promise<string> {
  const expiresInMinutes = params.expiresInMinutes || 15;
  const now = Date.now();
  const expiresAt = now + expiresInMinutes * 60 * 1000;

  const token = generateImpersonationToken();

  impersonationTokens.set(token, {
    adminId: params.adminId,
    adminName: params.adminName,
    adminEmail: params.adminEmail,
    targetUserId: params.targetUserId,
    targetUserName: params.targetUserName,
    targetUserEmail: params.targetUserEmail,
    reason: params.reason,
    createdAt: now,
    expiresAt,
    ip: params.ip,
  });

  return token;
}

/**
 * Get impersonation token data
 */
export function getImpersonationTokenData(token: string): {
  adminId: string;
  adminName: string;
  adminEmail: string;
  targetUserId: string;
  targetUserName: string;
  targetUserEmail: string;
  reason?: string;
  createdAt: number;
  expiresAt: number;
  ip?: string;
} | null {
  const data = impersonationTokens.get(token);

  if (!data) {
    return null;
  }

  // Check expiration
  if (data.expiresAt < Date.now()) {
    impersonationTokens.delete(token);
    return null;
  }

  return data;
}

/**
 * Revoke an impersonation token
 */
export function revokeImpersonationToken(token: string): void {
  impersonationTokens.delete(token);
}

/**
 * Get impersonation context from request (cookie)
 * Returns the actual acting user ID and impersonator ID if impersonation is active
 */
export async function getImpersonationFromRequest(): Promise<{
  actingUserId: string;
  impersonatorId: string;
  impersonatorName: string;
  impersonatorEmail: string;
  reason?: string;
} | null> {
  try {
    const cookieStore = await cookies();
    const impersonationCookie = cookieStore.get("impersonation-token");

    if (!impersonationCookie?.value) {
      return null;
    }

    const tokenData = getImpersonationTokenData(impersonationCookie.value);

    if (!tokenData) {
      return null;
    }

    return {
      actingUserId: tokenData.targetUserId,
      impersonatorId: tokenData.adminId,
      impersonatorName: tokenData.adminName,
      impersonatorEmail: tokenData.adminEmail,
      reason: tokenData.reason,
    };
  } catch (error) {
    console.error("Error getting impersonation context:", error);
    return null;
  }
}

/**
 * Log an impersonation event
 */
export async function logImpersonationEvent(params: {
  action: "START" | "STOP" | "ASSUME";
  adminId: string;
  adminName: string;
  targetUserId: string;
  targetUserName: string;
  reason?: string;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  const logData = {
    event: "impersonation",
    action: params.action,
    timestamp: new Date().toISOString(),
    admin: {
      id: params.adminId,
      name: params.adminName,
    },
    target: {
      id: params.targetUserId,
      name: params.targetUserName,
    },
    reason: params.reason,
    ip: params.ip,
    userAgent: params.userAgent,
  };

  // Log to console (structured logging)
  console.log(JSON.stringify(logData));

  // TODO: If your app has a persistent audit logging service, call it here
  // Example: await auditLogService.log(logData);
}

/**
 * Check if Redis is available (for multi-instance deployments)
 * This is a placeholder - implement if you need multi-instance support
 */
export function isRedisAvailable(): boolean {
  return false; // TODO: Implement Redis check if needed
}
