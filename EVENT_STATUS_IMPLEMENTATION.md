# Event Status Implementation

This document describes the implementation of automatic event status management for the event ticketing system.

## Overview

The system now automatically manages event statuses based on two key conditions:

1. **Expired Events**: Events whose end date has passed are automatically marked as "EXPIRED"
2. **Full House Events**: Events where all tickets are sold out are marked as "FULL_HOUSE"

## Database Changes

### Schema Updates

The `EventStatus` enum has been updated to include two new statuses:

```prisma
enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELLED
  COMPLETED
  EXPIRED      // NEW: For events that have passed
  FULL_HOUSE   // NEW: For events that are sold out
}
```

### Migration

Run the following command to apply the database changes:

```bash
npx prisma migrate dev --name add-expired-and-full-house-status
```

## Implementation Components

### 1. Event Status Utility (`lib/event-status.ts`)

Contains utility functions for:

- `calculateEventStatus()`: Determines the appropriate status based on current conditions
- `isEventExpired()`: Checks if an event has passed its end date
- `isEventSoldOut()`: Checks if an event is sold out
- `getEventStatusMessage()`: Returns human-readable status messages
- `getEventStatusClass()`: Returns CSS classes for styling

### 2. Database Actions (`lib/actions/event.ts`)

Added new functions:

- `updateEventStatuses()`: Bulk updates event statuses based on current conditions
- `getCalculatedEventStatus()`: Gets the calculated status for a specific event

### 3. UI Components (`components/events/event-status-badge.tsx`)

- `EventStatusBadge`: Displays event status with proper styling and icons
- `EventStatusWithLogic`: Component that automatically calculates and displays the correct status

### 4. API Endpoint (`app/api/admin/update-event-statuses/route.ts`)

Admin-only endpoints:

- `GET`: View events that need status updates (read-only)
- `POST`: Manually trigger status updates

### 5. Update Script (`scripts/update-event-statuses.ts`)

Standalone script that can be run manually or scheduled via cron job.

## Usage

### Automatic Status Updates

The system automatically calculates the correct status when:

- Events are fetched from the database
- The `EventStatusWithLogic` component is used
- The `updateEventStatuses()` function is called

### Manual Status Updates

#### Via API (Admin only)

```bash
# Check events needing updates
curl -X GET /api/admin/update-event-statuses

# Trigger updates
curl -X POST /api/admin/update-event-statuses
```

#### Via Script

```bash
# Run manually
npx tsx scripts/update-event-statuses.ts

# Schedule via cron (every hour)
0 * * * * /path/to/project/scripts/update-event-statuses.ts
```

### Using the UI Components

```tsx
import { EventStatusBadge, EventStatusWithLogic } from "@/components/events/event-status-badge";

// Display static status
<EventStatusBadge status={event.status} showIcon />

// Display calculated status (recommended)
<EventStatusWithLogic event={event} showIcon useCalculatedStatus={true} />
```

## Status Logic

### Priority Order

1. **EXPIRED**: Event end date has passed
2. **FULL_HOUSE**: All tickets sold (but event hasn't ended)
3. **Current Status**: If no conditions are met, keep existing status

### Status Transitions

- `PUBLISHED` → `EXPIRED` (when end date passes)
- `PUBLISHED` → `FULL_HOUSE` (when sold out)
- `DRAFT` → `EXPIRED` (when end date passes)
- `FULL_HOUSE` → `EXPIRED` (when end date passes)

## Styling

Each status has associated CSS classes for consistent styling:

- **DRAFT**: Gray background
- **PUBLISHED**: Green background
- **CANCELLED**: Red background
- **COMPLETED**: Blue background
- **EXPIRED**: Orange background
- **FULL_HOUSE**: Purple background

## Monitoring and Maintenance

### Recommended Cron Schedule

```bash
# Update statuses every hour
0 * * * * /path/to/project/scripts/update-event-statuses.ts

# Or every 30 minutes for more frequent updates
*/30 * * * * /path/to/project/scripts/update-event-statuses.ts
```

### Monitoring

- Check the script logs for any errors
- Monitor the admin API endpoint for manual updates
- Review event statuses periodically in the admin dashboard

## Testing

### Test Cases

1. Create an event with a past end date → Should show as EXPIRED
2. Create an event with sold tickets >= max tickets → Should show as FULL_HOUSE
3. Create a normal event → Should show as PUBLISHED
4. Update an event's end date to past → Should automatically become EXPIRED
5. Sell all tickets for an event → Should automatically become FULL_HOUSE

### Manual Testing

```bash
# Test the update script
npx tsx scripts/update-event-statuses.ts

# Test the API endpoint (requires admin access)
curl -X POST /api/admin/update-event-statuses
```

## Future Enhancements

1. **Real-time Updates**: Implement WebSocket notifications for status changes
2. **Email Notifications**: Send notifications to hosts when their events change status
3. **Status History**: Track status change history for audit purposes
4. **Custom Statuses**: Allow hosts to set custom status messages
5. **Bulk Operations**: Add admin tools for bulk status updates
