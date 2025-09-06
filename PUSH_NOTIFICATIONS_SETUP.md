# Push Notifications Setup for Molle Event Platform

This document provides a complete guide to set up Firebase push notifications for the Molle Event Platform PWA, specifically configured to send notifications when dating KYC requests are approved.

## 🚀 Features Implemented

- ✅ Firebase Cloud Messaging (FCM) integration
- ✅ PWA-compatible push notifications
- ✅ Background and foreground message handling
- ✅ Automatic FCM token management
- ✅ Push notification on dating KYC approval
- ✅ Client-side permission management
- ✅ Service worker integration
- ✅ Database token storage and cleanup

## 📋 Prerequisites

1. Firebase project with Cloud Messaging enabled
2. PostgreSQL database (Prisma schema updated)
3. Next.js PWA app with service worker

## 🔧 Environment Variables

Add the following environment variables to your `.env.local` file:

### Client-side Firebase Configuration

```env
# Firebase Client Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Optional - App URL for notification links
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Server-side Firebase Admin Configuration

```env
# Firebase Admin SDK (Server-side, Keep Secret)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
```

## 🛠️ Setup Instructions

### 1. Firebase Project Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing one
   - Enable Cloud Messaging

2. **Generate Web App Configuration**
   - Go to Project Settings → General
   - Add a new web app
   - Copy the configuration values for client-side env vars

3. **Generate VAPID Key**
   - Go to Project Settings → Cloud Messaging
   - In "Web configuration" section, generate VAPID key pair
   - Copy the VAPID key for `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

4. **Generate Service Account Key**
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
   - Extract values for server-side env vars:
     - `project_id` → `FIREBASE_PROJECT_ID`
     - `private_key_id` → `FIREBASE_PRIVATE_KEY_ID`
     - `private_key` → `FIREBASE_PRIVATE_KEY`
     - `client_email` → `FIREBASE_CLIENT_EMAIL`
     - `client_id` → `FIREBASE_CLIENT_ID`

### 2. Database Migration

Run the Prisma migration to add the FCMToken table:

```bash
npx prisma migrate dev --name add-fcm-tokens
npx prisma generate
```

### 3. Update Firebase Service Worker Configuration

Edit `/public/firebase-messaging-sw.js` and replace the placeholder config with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-actual-auth-domain",
  projectId: "your-actual-project-id",
  storageBucket: "your-actual-storage-bucket",
  messagingSenderId: "your-actual-messaging-sender-id",
  appId: "your-actual-app-id",
};
```

### 4. Build and Deploy

```bash
npm run build
npm run start
```

## 📱 How It Works

### 1. User Flow

1. User opens the PWA
2. Push notification permission is requested automatically
3. FCM token is generated and stored in database
4. When admin approves dating KYC, push notification is sent
5. User receives notification on all their devices

### 2. Technical Flow

1. **Client Registration**: `PushNotificationManager` requests permission and generates FCM token
2. **Token Storage**: Token is saved via `/api/notifications/token` endpoint
3. **KYC Approval**: Admin approves KYC in `dating-admin.ts`
4. **Notification Trigger**: Push notification is sent using Firebase Admin SDK
5. **Message Delivery**: Firebase delivers to user's devices
6. **Background Handling**: Service worker shows notification if app is closed
7. **Foreground Handling**: In-app notification if app is open

## 🔔 Notification Types

### Dating KYC Approved

- **Title**: "Dating KYC Approved! 🎉"
- **Body**: "Congratulations {name}! Your dating profile has been approved. You can now start connecting with others."
- **Action**: Opens `/dashboard/social/discover`
- **Data**: `{ type: "DATING_KYC_APPROVED", userId: "...", link: "/dashboard/social/discover" }`

## 🛡️ Security Features

1. **Admin-only sending**: Only admin users can send notifications
2. **Token cleanup**: Old tokens are automatically cleaned up after 60 days
3. **User-specific tokens**: Each user's tokens are isolated
4. **Error handling**: Failed notifications don't break the main flow

## 🧪 Testing

### 1. Test Push Notifications

Use the API endpoint to send test notifications:

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "userId": "user_id_here",
    "title": "Test Notification",
    "body": "This is a test notification",
    "data": {
      "type": "TEST",
      "link": "/dashboard"
    }
  }'
```

### 2. Test KYC Approval Flow

1. Create a dating KYC request as a user
2. Login as admin
3. Approve the KYC request
4. Check that notification is received

## 🚨 Troubleshooting

### Common Issues

1. **No notifications received**
   - Check browser notification permissions
   - Verify Firebase configuration
   - Check browser console for errors
   - Ensure service worker is registered

2. **FCM token not generated**
   - Verify VAPID key is correct
   - Check that notification permission is granted
   - Ensure Firebase project has Cloud Messaging enabled

3. **Service worker errors**
   - Check Firebase configuration in service worker
   - Verify service worker is registered correctly
   - Check browser developer tools → Application → Service Workers

4. **Database errors**
   - Ensure Prisma migration was run
   - Check database connection
   - Verify FCMToken table exists

### Debug Commands

```bash
# Check if service worker is registered
console.log(await navigator.serviceWorker.getRegistrations())

# Check notification permission
console.log(Notification.permission)

# Check FCM token
// In browser console after permission granted
import { generateToken } from '/lib/firebase'
console.log(await generateToken())
```

## 📊 Monitoring

### Database Queries

```sql
-- Check FCM token count by user
SELECT userId, COUNT(*) as token_count
FROM fcm_tokens
GROUP BY userId;

-- Check recent tokens
SELECT * FROM fcm_tokens
WHERE "lastUsed" > NOW() - INTERVAL '7 days'
ORDER BY "lastUsed" DESC;

-- Clean up old tokens manually
DELETE FROM fcm_tokens
WHERE "lastUsed" < NOW() - INTERVAL '60 days';
```

### API Endpoints

- `POST /api/notifications/send` - Send notification to specific user
- `POST /api/notifications/token` - Save FCM token
- `DELETE /api/notifications/token` - Remove FCM token

## 🔮 Future Enhancements

1. **Notification Categories**: Different notification types for events, matches, etc.
2. **User Preferences**: Allow users to configure notification types
3. **Rich Notifications**: Add images and action buttons
4. **Analytics**: Track notification open rates
5. **Scheduling**: Schedule notifications for optimal times
6. **Topics**: Subscribe users to notification topics

## 📚 Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)
- [PWA Notification Best Practices](https://web.dev/notification-best-practices/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check browser console and network tabs for errors
4. Ensure Firebase project is configured correctly
5. Test with different browsers and devices

---

**Note**: This implementation is specifically designed for PWA usage and includes automatic token management, error handling, and cleanup. The notifications will work across all devices where the user has the PWA installed and has granted notification permissions.
