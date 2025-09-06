"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createReferralLink } from "@/lib/actions/link";
import { getEventsForDropdown } from "@/lib/actions/event";

interface CreateLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateLinkDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateLinkDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (open) {
      fetchEvents();
    }
  }, [open]);

  const fetchEvents = async () => {
    const result = await getEventsForDropdown(false); // false to get all events, not just host events

    if (result.success && result.data) {
      setEvents(result.data);
      if (result.data.length > 0) {
        setSelectedEventId(result.data[0].id);
      }
    } else {
      toast.error("Failed to fetch events", {
        description:
          result.error || "Could not load available events for referral links",
      });
    }
  };

  const handleCreate = async () => {
    if (!selectedEventId) {
      toast.error("Please select an event", {
        description: "You must select an event to create a referral link.",
      });
      return;
    }

    try {
      setIsLoading(true);

      const result = await createReferralLink({
        eventId: selectedEventId,
      });

      if (result.success) {
        const eventName = events.find((e) => e.id === selectedEventId)?.title;
        toast.success("Event referral link created", {
          description: `You can now share this link to earn rewards when users book tickets for ${
            eventName || "this event"
          }`,
        });
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error("Failed to create referral link", {
          description:
            result.error ||
            "There was a problem creating your referral link. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Failed to create referral link", {
        description:
          "An unexpected error occurred. Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Event Referral Link</DialogTitle>
          <DialogDescription>
            Create a new referral link for an event to earn commissions on
            bookings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Select Event</Label>
            <Select
              value={selectedEventId}
              onValueChange={setSelectedEventId}
              disabled={events.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    events.length === 0
                      ? "No events available"
                      : "Select an event"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading}>
            Create Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
