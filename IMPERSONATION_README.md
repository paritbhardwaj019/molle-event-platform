# Admin Impersonation Feature

## Overview

This feature allows admin users to securely impersonate other users for customer support purposes. It implements a secure, auditable, and time-limited impersonation system.

## Security Architecture

### Why No Global Secret?

We deliberately **do not implement** a global secret or backdoor that allows arbitrary account access without RBAC and auditability. Here's why this design is safer:

1. **Principle of Least Privilege**: Only authenticated admins can initiate impersonation after providing a valid reason
2. **Audit Trail**: Every impersonation action is logged with admin ID, timestamp, reason, and IP address
3. **Time-Limited**: Tokens expire after 15 minutes, reducing risk of unauthorized access
4. **No Backdoors**: No mechanism exists to bypass normal authentication flows
5. **Accountability**: Every action taken during impersonation can be traced back to the admin

### Security Controls

- ✅ **Admin-only**: Only users with `role === 'ADMIN'` can start impersonation
- ✅ **Ephemeral tokens**: Short-lived (15 minutes) cryptographically secure tokens
- ✅ **Required re-auth**: Admin must confirm with "CONFIRM" in UI
- ✅ **Required reason**: Admin must provide a reason that is logged
- ✅ **Audit logging**: All actions logged with structured data
- ✅ **Secure cookies**: HttpOnly, Secure (production), SameSite=Strict
- ✅ **HTTPS required**: In production, cookies require Secure flag
- ✅ **Token invalidation**: Tokens can be manually revoked

## File Structure

```
lib/
  └── impersonation.ts          # Core impersonation helpers
app/
  ├── api/admin/impersonate/
  │   ├── start/route.ts        # Create impersonation token
  │   ├── assume/route.ts       # Set impersonation cookie
  │   ├── stop/route.ts         # Revoke token and clear cookie
  │   └── status/route.ts       # Check active impersonation
  └── (dashboard)/dashboard/admin/impersonate/
      └── page.tsx              # Admin UI for impersonation
```

## API Endpoints

### POST `/api/admin/impersonate/start`

Creates an ephemeral impersonation token.

**Request:**

```json
{
  "targetUserIdOrEmail": "user@example.com",
  "reason": "Customer support - investigating payment issue"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "a1b2c3d4e5f6...",
    "expiresAt": "2024-01-01T12:00:00.000Z",
    "targetUser": {
      "id": "usr_abc123",
      "name": "John Doe",
      "email": "user@example.com"
    }
  }
}
```

### POST `/api/admin/impersonate/assume`

Sets the impersonation cookie to activate impersonation.

**Request:**

```json
{
  "token": "a1b2c3d4e5f6..."
}
```

**Response:**

```json
{
  "success": true,
  "message": "Impersonation started",
  "data": {
    "targetUserId": "usr_abc123",
    "targetUserName": "John Doe",
    "expiresAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Sets Cookie:**

```
impersonation-token=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900
```

### POST `/api/admin/impersonate/stop`

Stops impersonation and clears the cookie.

**Response:**

```json
{
  "success": true,
  "message": "Impersonation stopped"
}
```

### GET `/api/admin/impersonate/status`

Check if impersonation is currently active.

**Response:**

```json
{
  "active": true,
  "targetUserId": "usr_abc123",
  "impersonatorId": "adm_xyz789",
  "impersonatorName": "Admin User"
}
```

## Usage in API Routes

### Example: Using Impersonation Context

```typescript
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if impersonation is active
  if (session.impersonation) {
    console.log(
      `Admin ${session.impersonation.impersonatorName} is impersonating user ${session.user.id}`
    );

    // Log the impersonator ID for audit purposes
    // Any actions taken will be attributed to the target user
    // but you can log the impersonator ID separately
  }

  // Use session.user.id as normal - it will be the target user ID if impersonating
  const userId = session.user.id;

  return NextResponse.json({ userId });
}
```

### Example: Protected API Route with Impersonation Logging

```typescript
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Log if impersonation is active
  if (session.impersonation) {
    console.log(
      JSON.stringify({
        event: "api_action_during_impersonation",
        api: "POST /api/example",
        impersonatorId: session.impersonation.impersonatorId,
        impersonatorName: session.impersonation.impersonatorName,
        targetUserId: session.user.id,
        reason: session.impersonation.reason,
      })
    );
  }

  // Perform the action as the target user
  const result = await db.something.create({
    data: {
      userId: session.user.id, // This will be the target user ID
      // ... other data
    },
  });

  return NextResponse.json(result);
}
```

## Usage in Server Components

```typescript
import { auth } from "@/lib/auth";

export default async function MyServerComponent() {
  const session = await auth();

  if (!session?.user) {
    return <div>Not authenticated</div>;
  }

  // Check for impersonation
  if (session.impersonation) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-4">
        <p>⚠️ Admin Impersonation Active</p>
        <p>You are currently viewing as {session.user.name}</p>
        <p>Admin: {session.impersonation.impersonatorName}</p>
      </div>
    );
  }

  return <div>Normal view</div>;
}
```

## Storage and Multi-Instance Deployments

### In-Memory Storage (Current Implementation)

The current implementation stores impersonation tokens in memory using a `Map`. This works well for:

- Single-instance deployments
- Development environments
- Small-scale production deployments

**Limitations:**

- Tokens are not shared across multiple instances
- Tokens are lost on server restart
- Not suitable for horizontal scaling

### Redis (Recommended for Production)

For multi-instance deployments, use Redis for token storage:

1. **Install Redis client:**

```bash
npm install redis
npm install -D @types/redis
```

2. **Update `lib/impersonation.ts`:**

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function createImpersonationToken(params: {...}) {
  const token = generateImpersonationToken();

  const data = {
    ...params,
    createdAt: Date.now(),
    expiresAt: Date.now() + 15 * 60 * 1000,
  };

  // Store in Redis with TTL
  await redis.setex(
    `impersonation:${token}`,
    900, // 15 minutes in seconds
    JSON.stringify(data)
  );

  return token;
}

export async function getImpersonationTokenData(token: string) {
  const data = await redis.get(`impersonation:${token}`);

  if (!data) {
    return null;
  }

  return JSON.parse(data);
}

export async function revokeImpersonationToken(token: string) {
  await redis.del(`impersonation:${token}`);
}
```

**Note:** This still does not require database schema changes - Redis is used as a cache.

## Environment Variables

No new environment variables are required. The feature uses existing:

- `JWT_SECRET` - For verifying auth tokens
- `NODE_ENV` - To determine if cookies should be Secure

Optional:

- `REDIS_URL` - If using Redis for multi-instance support

## Audit Logging

All impersonation events are logged as structured JSON:

```json
{
  "event": "impersonation",
  "action": "START",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "admin": {
    "id": "adm_xyz789",
    "name": "Admin User"
  },
  "target": {
    "id": "usr_abc123",
    "name": "John Doe"
  },
  "reason": "Customer support",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

### Integrating with Your Audit Service

To store these logs persistently, update `lib/impersonation.ts`:

```typescript
export async function logImpersonationEvent(params: {...}) {
  const logData = { ... };

  // Log to console
  console.log(JSON.stringify(logData));

  // Send to your audit service
  try {
    await fetch(process.env.AUDIT_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });
  } catch (error) {
    console.error('Failed to send audit log:', error);
  }
}
```

## Email Notifications (Optional)

To notify users when they are being impersonated, uncomment the email sending code in `/api/admin/impersonate/start/route.ts` and add the email template to `lib/email.tsx`.

## Testing

### Manual Testing

1. Login as an admin user
2. Navigate to `/dashboard/admin/impersonate`
3. Enter a target user's email or ID
4. Provide a reason
5. Type "CONFIRM" and click "Confirm & Start"
6. You should now be acting as the target user
7. Navigate to user-specific pages to verify
8. Click "Stop Impersonation" to return to admin account

### Automated Testing

```typescript
// Example test
describe("Impersonation", () => {
  it("should start impersonation", async () => {
    // Login as admin
    const adminSession = await loginAsAdmin();

    // Start impersonation
    const startResponse = await fetch("/api/admin/impersonate/start", {
      method: "POST",
      headers: {
        Cookie: adminSession.cookie,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targetUserIdOrEmail: "user@example.com",
        reason: "Test reason",
      }),
    });

    expect(startResponse.ok).toBe(true);
    const { data } = await startResponse.json();
    expect(data.token).toBeDefined();
  });
});
```

## Security Best Practices

1. **Enable 2FA for Admin Users**: Require two-factor authentication for admin accounts
2. **Rate Limiting**: Implement rate limiting on impersonation endpoints
3. **Monitor Logs**: Set up alerts for impersonation events
4. **Regular Audits**: Review impersonation logs regularly
5. **Short Token TTL**: Keep token expiration short (15 minutes or less)
6. **HTTPS Only**: Ensure all traffic is over HTTPS in production
7. **Redis for Multi-Instance**: Use Redis for token storage if running multiple instances

## Troubleshooting

### Token Expired

**Issue:** Token expires after 15 minutes  
**Solution:** Stop and restart impersonation

### Multi-Instance Issues

**Issue:** Tokens not working across instances  
**Solution:** Implement Redis storage as described above

### Cookies Not Being Set

**Issue:** Impersonation cookie not being set  
**Solution:** Check HTTPS settings and cookie flags (Secure, SameSite)

## Support

For issues or questions about the impersonation feature, contact the development team.
