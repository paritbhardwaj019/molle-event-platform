# Notification System Implementation

This document outlines the comprehensive notification system implemented for the Molle Event Platform.

## Features Implemented

### 1. Database Schema

- **Notification Model**: Added `Notification` table with fields for title, message, type, read status, user association, and metadata
- **Notification Types**: Enum supporting various notification types including:
  - `DATING_KYC_APPROVED` / `DATING_KYC_REJECTED`
  - `NEW_MATCH`
  - `NEW_MESSAGE`
  - `EVENT_REMINDER`
  - `BOOKING_CONFIRMED`
  - `PAYOUT_APPROVED` / `PAYOUT_REJECTED`
  - `INVITE_APPROVED` / `INVITE_REJECTED`
  - `GENERAL`

### 2. API Endpoints

- **GET /api/notifications**: Fetch user notifications with pagination
- **GET /api/notifications/unread-count**: Get count of unread notifications
- **POST /api/notifications/mark-read**: Mark individual or all notifications as read

### 3. Server Actions

- **Notification CRUD**: Complete server actions for creating, reading, and updating notifications
- **Helper Functions**: Specialized functions for creating specific notification types
- **Dating KYC Integration**: Functions to handle KYC approval/rejection with automatic notifications

### 4. UI Components

#### NotificationDropdown Component

- **Bell Icon**: Shows in header with unread count badge
- **Dropdown Interface**: Displays recent notifications with read/unread status
- **Mark as Read**: Individual and bulk mark-as-read functionality
- **Rich Notifications**: Icons, colors, and timestamps for different notification types
- **Responsive Design**: Optimized for both desktop and mobile

#### Header Integration

- **Desktop**: Notification bell positioned before user dropdown
- **Mobile**: Integrated into mobile menu with proper styling
- **Real-time Updates**: Polls for unread count every 30 seconds
- **Visual Feedback**: Color-coded notifications and unread indicators

### 5. Dating System Integration

- **KYC Approval Notifications**: Automatic notifications when dating KYC is approved/rejected
- **Match Notifications**: Notifications sent to both users when they match
- **Admin Functions**: Added admin functions to approve/reject KYC with notifications

## Usage

### For Users

1. **Viewing Notifications**: Click the bell icon in the header
2. **Reading Notifications**: Click on individual notifications to mark as read
3. **Bulk Actions**: Use "Mark all read" to clear all unread notifications

### For Developers

1. **Creating Notifications**: Use helper functions in `lib/actions/notifications.ts`
2. **Custom Types**: Add new notification types to the enum as needed
3. **Integration**: Import and use notification functions in your features

### Examples

```typescript
// Create a dating KYC approval notification
await createDatingKycApprovalNotification(userId);

// Create a custom notification
await createNotification({
  title: "Custom Title",
  message: "Custom message",
  type: "GENERAL",
  userId: userId,
  data: { customField: "value" },
});

// Mark notification as read
await markNotificationAsRead(notificationId);
```

## File Structure

```
├── prisma/schema.prisma                     # Database schema with Notification model
├── app/api/notifications/                   # API endpoints
│   ├── route.ts                            # Main notifications endpoint
│   ├── unread-count/route.ts               # Unread count endpoint
│   └── mark-read/route.ts                  # Mark as read endpoint
├── lib/actions/notifications.ts            # Server actions for notifications
├── lib/actions/dating.ts                   # Updated with notification integration
├── components/notifications/
│   └── notification-dropdown.tsx           # Main notification UI component
└── components/header.tsx                   # Updated header with notifications
```

## Database Migration

The notification system has been synced with the database using `prisma db push`. The tables are ready for use.

## Next Steps

1. **Real-time Updates**: Consider implementing WebSocket or Server-Sent Events for instant notifications
2. **Email Notifications**: Extend to send email notifications for important events
3. **Push Notifications**: Integrate with the existing FCM system for push notifications
4. **Notification Preferences**: Allow users to customize notification preferences
5. **Admin Dashboard**: Create admin interface to manage system-wide notifications

