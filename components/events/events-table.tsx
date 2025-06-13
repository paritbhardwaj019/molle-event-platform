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
import { Copy, Trash2, Eye, Star } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getAllEvents,
  deleteEvent,
  updateEventFeaturedStatus,
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

export function EventsTable() {
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvents(events.map((event) => event.id));
    } else {
      setSelectedEvents([]);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) => {
      if (prev.includes(eventId)) {
        return prev.filter((id) => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  const handleCopyEventUrl = (slug: string) => {
    const url = `${process.env.NEXT_PUBLIC_URL}/events/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Event URL copied to clipboard", {
      description: "You can now share this link with others",
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      setIsDeleting(true);
      const result = await deleteEvent(eventId);

      if (result.success) {
        setEvents((prevEvents) =>
          prevEvents.filter((event) => event.id !== eventId)
        );
        toast.success("Event deleted successfully", {
          description: "The event has been deleted successfully",
        });
      } else {
        toast.error(result.error || "Failed to delete event");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the event");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFeatured = async (
    eventId: string,
    currentStatus: boolean
  ) => {
    try {
      setIsUpdating(true);
      const result = await updateEventFeaturedStatus(eventId, !currentStatus);

      if (result.success) {
        setEvents((prevEvents) =>
          prevEvents.map((event) =>
            event.id === eventId
              ? { ...event, isFeatured: !currentStatus }
              : event
          )
        );
        toast.success(
          `Event ${!currentStatus ? "featured" : "unfeatured"} successfully`
        );
      } else {
        toast.error(result.error || "Failed to update featured status");
      }
    } catch (error) {
      toast.error("An error occurred while updating featured status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead className="w-[30px]">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead>Event Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-md">
                      <Skeleton className="h-full w-full" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-gray-50">
            <TableHead className="w-[30px]">
              <Checkbox
                checked={
                  selectedEvents.length === events.length && events.length > 0
                }
                onCheckedChange={(checked) => toggleAll(checked as boolean)}
              />
            </TableHead>
            <TableHead>Event Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Bookings</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>
                <Checkbox
                  checked={selectedEvents.includes(event.id)}
                  onCheckedChange={() => toggleEvent(event.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-md">
                    <Image
                      src={event.coverImage}
                      alt={event.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="font-medium">{event.title}</span>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {truncateText(event.description, 60)}
                    </p>
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
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    event.status === "PUBLISHED"
                      ? "bg-green-50 text-green-700"
                      : event.status === "DRAFT"
                      ? "bg-gray-50 text-gray-700"
                      : event.status === "CANCELLED"
                      ? "bg-red-50 text-red-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {event.status}
                </span>
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${
                            event.isFeatured
                              ? "text-yellow-500 hover:text-yellow-600"
                              : "text-gray-400 hover:text-gray-600"
                          } hover:bg-gray-50`}
                          onClick={() =>
                            handleToggleFeatured(event.id, event.isFeatured)
                          }
                          disabled={isUpdating}
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {event.isFeatured
                            ? "Unfeature event"
                            : "Feature event"}
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                          onClick={() => handleCopyEventUrl(event.slug)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy event URL</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-gray-50"
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Event</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this event? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteEvent(event.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete event</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
