import { EventStatus } from "@prisma/client";

export interface EventStatusData {
  id: string;
  status: EventStatus;
  startDate: Date;
  endDate: Date;
  maxTickets: number;
  soldTickets: number;
}

/**
 * Determines the appropriate event status based on current conditions
 * @param event - Event data with status information
 * @returns The calculated event status
 */
export function calculateEventStatus(event: EventStatusData): EventStatus {
  const now = new Date();

  // Check if event has passed (expired)
  if (event.endDate < now) {
    return EventStatus.EXPIRED;
  }

  // Check if all tickets are sold out (full house)
  if (event.soldTickets >= event.maxTickets) {
    return EventStatus.FULL_HOUSE;
  }

  // Return current status if no conditions are met
  return event.status;
}

/**
 * Checks if an event should be marked as expired
 * @param endDate - Event end date
 * @returns boolean indicating if event is expired
 */
export function isEventExpired(endDate: Date): boolean {
  return endDate < new Date();
}

/**
 * Checks if an event is sold out (full house)
 * @param soldTickets - Number of tickets sold
 * @param maxTickets - Maximum number of tickets available
 * @returns boolean indicating if event is sold out
 */
export function isEventSoldOut(
  soldTickets: number,
  maxTickets: number
): boolean {
  return soldTickets >= maxTickets;
}

/**
 * Gets a human-readable status message for display
 * @param status - Event status
 * @returns Human-readable status message
 */
export function getEventStatusMessage(status: EventStatus): string {
  switch (status) {
    case EventStatus.DRAFT:
      return "Draft";
    case EventStatus.PUBLISHED:
      return "Published";
    case EventStatus.CANCELLED:
      return "Cancelled";
    case EventStatus.COMPLETED:
      return "Completed";
    case EventStatus.EXPIRED:
      return "Expired";
    case EventStatus.FULL_HOUSE:
      return "Full House";
    default:
      return "Unknown";
  }
}

/**
 * Gets the appropriate CSS class for styling based on event status
 * @param status - Event status
 * @returns CSS class name for styling
 */
export function getEventStatusClass(status: EventStatus): string {
  switch (status) {
    case EventStatus.DRAFT:
      return "bg-gray-100 text-gray-800";
    case EventStatus.PUBLISHED:
      return "bg-green-100 text-green-800";
    case EventStatus.CANCELLED:
      return "bg-red-100 text-red-800";
    case EventStatus.COMPLETED:
      return "bg-blue-100 text-blue-800";
    case EventStatus.EXPIRED:
      return "bg-orange-100 text-orange-800";
    case EventStatus.FULL_HOUSE:
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
