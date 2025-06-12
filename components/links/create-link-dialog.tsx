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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createReferralLink } from "@/lib/actions/link";
import { getEventsForDropdown } from "@/lib/actions/event";
import { ReferralLinkType } from "@prisma/client";

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
  const [linkType, setLinkType] = useState<ReferralLinkType>(
    ReferralLinkType.SIGNUP
  );
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (open && linkType === ReferralLinkType.EVENT) {
      fetchEvents();
    }
  }, [open, linkType]);

  const fetchEvents = async () => {
    if (linkType === ReferralLinkType.EVENT) {
      const result = await getEventsForDropdown(true);

      if (result.success && result.data) {
        setEvents(result.data);
        if (result.data.length > 0) {
          setSelectedEventId(result.data[0].id);
        }
      } else {
        toast.error("Failed to fetch events", {
          description:
            result.error ||
            "Could not load available events for referral links",
        });
      }
    }
  };

  const handleCreate = async () => {
    try {
      setIsLoading(true);

      const result = await createReferralLink({
        type: linkType,
        eventId:
          linkType === ReferralLinkType.EVENT ? selectedEventId : undefined,
      });

      if (result.success) {
        const eventName = events.find((e) => e.id === selectedEventId)?.title;
        toast.success(
          linkType === ReferralLinkType.SIGNUP
            ? "Signup referral link created"
            : "Event referral link created",
          {
            description:
              linkType === ReferralLinkType.SIGNUP
                ? "You can now share this link to earn rewards when users sign up through it"
                : `You can now share this link to earn rewards when users book tickets for ${
                    eventName || "this event"
                  }`,
          }
        );
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
          <DialogTitle>Create Referral Link</DialogTitle>
          <DialogDescription>
            Create a new referral link for signups or events.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Link Type</Label>
            <RadioGroup
              value={linkType}
              onValueChange={async (value: ReferralLinkType) => {
                setLinkType(value);
                if (value === ReferralLinkType.EVENT) {
                  setSelectedEventId("");
                  await fetchEvents();
                }
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ReferralLinkType.SIGNUP} id="signup" />
                <Label htmlFor="signup">Signup</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ReferralLinkType.EVENT} id="event" />
                <Label htmlFor="event">Event</Label>
              </div>
            </RadioGroup>
          </div>

          {linkType === ReferralLinkType.EVENT && (
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
          )}
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
