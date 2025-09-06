"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getAdminPushNotificationHistory } from "@/lib/actions/notifications";
import type { PushNotificationHistoryItem } from "@/lib/actions/notifications";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface PushNotificationsTableProps {
  key?: string;
  onNotificationSent?: () => void;
}

export function PushNotificationsTable({
  onNotificationSent,
}: PushNotificationsTableProps) {
  const [notifications, setNotifications] = useState<
    PushNotificationHistoryItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const result = await getAdminPushNotificationHistory();
      if (result.success && result.data) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch push notifications:", error);
      toast.error("Failed to load push notifications", {
        description:
          "There was a problem loading your push notification history. Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getAudienceBadgeColor = (audience: string) => {
    switch (audience) {
      case "ALL":
        return "bg-purple-100 text-purple-700";
      case "HOST":
        return "bg-blue-100 text-blue-700";
      case "USER":
        return "bg-green-100 text-green-700";
      case "REFERRER":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getSuccessRate = (notification: PushNotificationHistoryItem) => {
    if (notification.sentCount === 0) return 0;
    return Math.round(
      (notification.successCount / notification.sentCount) * 100
    );
  };

  const handleOpenLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead>
                Delivery Stats
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="ml-1 h-4 w-4 inline-block text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Success rate and total devices reached</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[200px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[300px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[120px]" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
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
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead>
                Delivery Stats
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="ml-1 h-4 w-4 inline-block text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Success rate and total devices reached</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="text-end">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notifications.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  No push notifications sent yet.
                  <br />
                  <span className="text-sm">
                    Send your first promotional notification to get started!
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <div
                        className="font-medium text-sm truncate"
                        title={notification.title}
                      >
                        {notification.title}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <div
                        className="text-sm text-gray-600 truncate"
                        title={notification.message}
                      >
                        {notification.message}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs ${getAudienceBadgeColor(notification.targetAudience)}`}
                      variant="secondary"
                    >
                      {notification.targetAudience}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {format(new Date(notification.createdAt), "MMM d, yyyy")}
                      <br />
                      <span className="text-xs text-gray-400">
                        {format(new Date(notification.createdAt), "HH:mm")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-green-600">
                        {getSuccessRate(notification)}% success
                      </div>
                      <div className="text-xs text-gray-500">
                        {notification.successCount}/{notification.sentCount}{" "}
                        devices
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      {notification.linkUrl && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                onClick={() =>
                                  handleOpenLink(notification.linkUrl!)
                                }
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Open notification link</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
