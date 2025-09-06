"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Copy, Trash2, Eye, Star, Edit } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getAllEvents,
  deleteEvent,
  updateEventFeaturedStatus,
  getEventById,
} from "@/lib/actions/event";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLoggedInUser } from "@/lib/hooks/use-logged-in-user";
import { type EventFormData } from "@/lib/validations/event";
import { EventStatusWithLogic } from "./event-status-badge";

interface Event {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  status: string;
  eventType: string;
  startDate: Date;
  endDate: Date;
  maxTickets: number;
  soldTickets: number;
  bookings: any[];
  slug: string;
  isFeatured: boolean;
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

interface EventsTableProps {
  onEditEvent?: (event: EventFormData & { id: string }) => void;
}

export function EventsTableWithNewStatus({ onEditEvent }: EventsTableProps) {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const { user } = useLoggedInUser();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const result = await getAllEvents();
        if (result.success && result.data) {
          setEvents(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // ... existing functions would go here ...

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={
                  events.length > 0 && selectedEvents.length === events.length
                }
                onCheckedChange={(checked) => toggleAll(checked as boolean)}
              />
            </TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Max Tickets</TableHead>
            <TableHead>Bookings</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                <Checkbox
                  checked={selectedEvents.includes(event.id)}
                  onCheckedChange={(checked) =>
                    toggleEventSelection(event.id, checked as boolean)
                  }
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Image
                    src={event.coverImage}
                    alt={event.title}
                    width={48}
                    height={48}
                    className="rounded-md object-cover"
                  />
                  <div>
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-500">
                      {truncateText(event.description, 50)}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    event.eventType === "NORMAL"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-purple-50 text-purple-700"
                  }`}
                >
                  {event.eventType === "NORMAL" ? "Public" : "Invite Only"}
                </span>
              </TableCell>
              <TableCell>
                {/* NEW: Using the EventStatusWithLogic component */}
                <EventStatusWithLogic
                  event={{
                    id: event.id,
                    status: event.status as any,
                    startDate: new Date(event.startDate),
                    endDate: new Date(event.endDate),
                    maxTickets: event.maxTickets,
                    soldTickets: event.soldTickets,
                  }}
                  showIcon={true}
                  useCalculatedStatus={true}
                />
              </TableCell>
              <TableCell>
                {format(new Date(event.startDate), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                {format(new Date(event.endDate), "MMM d, yyyy")}
              </TableCell>
              <TableCell>{event.maxTickets}</TableCell>
              <TableCell>{event.bookings.length}</TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  {/* ... existing action buttons would go here ... */}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Helper functions (these would be the same as in the original component)
function toggleAll(checked: boolean) {
  // Implementation would go here
}

function toggleEventSelection(eventId: string, checked: boolean) {
  // Implementation would go here
}
