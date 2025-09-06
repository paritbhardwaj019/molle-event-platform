"use client";

import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sendAdminPushNotification } from "@/lib/actions/notifications";
import type { AdminPushNotificationData } from "@/lib/actions/notifications";
import { Bell, Users, Crown, HandshakeIcon, Globe } from "lucide-react";

interface CreateNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const audienceOptions = [
  {
    value: "ALL",
    label: "All Users",
    description: "Send to everyone on the platform",
    icon: Globe,
    color: "text-purple-600",
  },
  {
    value: "HOST",
    label: "Hosts Only",
    description: "Send to all event hosts",
    icon: Crown,
    color: "text-blue-600",
  },
  {
    value: "USER",
    label: "Regular Users",
    description: "Send to all regular users",
    icon: Users,
    color: "text-green-600",
  },
  {
    value: "REFERRER",
    label: "Referrers Only",
    description: "Send to all referrers",
    icon: HandshakeIcon,
    color: "text-orange-600",
  },
];

export function CreateNotificationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateNotificationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AdminPushNotificationData>({
    title: "",
    message: "",
    imageUrl: "",
    linkUrl: "",
    targetAudience: "ALL",
  });

  const handleInputChange = (
    field: keyof AdminPushNotificationData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSend = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a notification title", {
        description: "The title field is required.",
      });
      return;
    }

    if (!formData.message.trim()) {
      toast.error("Please enter a notification message", {
        description: "The message field is required.",
      });
      return;
    }

    try {
      setIsLoading(true);

      const result = await sendAdminPushNotification({
        title: formData.title.trim(),
        message: formData.message.trim(),
        imageUrl: formData.imageUrl?.trim() || undefined,
        linkUrl: formData.linkUrl?.trim() || undefined,
        targetAudience: formData.targetAudience,
      });

      if (result.success) {
        const audienceLabel = audienceOptions.find(
          (opt) => opt.value === formData.targetAudience
        )?.label;

        const successCount = result.data?.successCount || 0;
        const totalSent = result.data?.sentTo || 0;
        const failureCount = result.data?.failureCount || 0;
        const inAppNotifications = result.data?.inAppNotifications || 0;
        const totalTargetUsers = result.data?.totalTargetUsers || 0;

        if (successCount === totalSent && totalSent > 0) {
          toast.success("Notifications sent successfully! 🎉", {
            description: `Push notifications delivered to all ${successCount} devices and ${inAppNotifications} in-app notifications created for ${audienceLabel}.`,
          });
        } else if (totalSent > 0) {
          toast.success("Notifications sent! 📱", {
            description: `Push: ${successCount}/${totalSent} devices (${failureCount} invalid tokens cleaned). In-app: ${inAppNotifications}/${totalTargetUsers} users for ${audienceLabel}.`,
          });
        } else {
          toast.success("In-app notifications sent! 📬", {
            description: `Created ${inAppNotifications} in-app notifications for ${audienceLabel}. No push notification devices found.`,
          });
        }

        // Reset form
        setFormData({
          title: "",
          message: "",
          imageUrl: "",
          linkUrl: "",
          targetAudience: "ALL",
        });

        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error("Failed to send push notification", {
          description:
            result.error ||
            "There was a problem sending your notification. Please try again.",
        });
      }
    } catch (error) {
      toast.error("Failed to send push notification", {
        description:
          "An unexpected error occurred. Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedAudience = () => {
    return audienceOptions.find((opt) => opt.value === formData.targetAudience);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600" />
            Send Push Notification
          </DialogTitle>
          <DialogDescription>
            Send a promotional push notification to users on their devices. This
            will create native notifications on PWA and mobile devices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Notification Title *</Label>
            <Input
              id="title"
              placeholder="e.g., New Events This Week! 🎉"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              maxLength={60}
            />
            <p className="text-xs text-gray-500">
              {formData.title.length}/60 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Discover amazing events happening near you this weekend..."
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              {formData.message.length}/200 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label>Target Audience *</Label>
            <Select
              value={formData.targetAudience}
              onValueChange={(value) =>
                handleInputChange("targetAudience", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {audienceOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className={`h-4 w-4 ${option.color}`} />
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {getSelectedAudience() && (
              <p className="text-xs text-gray-600 flex items-center gap-1">
                {React.createElement(getSelectedAudience()!.icon, {
                  className: `h-3 w-3 ${getSelectedAudience()!.color}`,
                })}
                {getSelectedAudience()!.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl}
              onChange={(e) => handleInputChange("imageUrl", e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Add an image to make your notification more engaging
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkUrl">Action Link (optional)</Label>
            <Input
              id="linkUrl"
              placeholder="https://example.com/events"
              value={formData.linkUrl}
              onChange={(e) => handleInputChange("linkUrl", e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Where users will go when they tap the notification
            </p>
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
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Notification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
