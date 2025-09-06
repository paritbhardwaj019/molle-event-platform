"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Heart,
  Calendar,
  CreditCard,
  UserCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data?: any;
  createdAt: string;
}

interface NotificationDropdownProps {
  className?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "DATING_KYC_APPROVED":
    case "DATING_KYC_REJECTED":
      return <UserCheck className="w-4 h-4" />;
    case "NEW_MATCH":
      return <Heart className="w-4 h-4 text-red-500" />;
    case "NEW_MESSAGE":
      return <Clock className="w-4 h-4" />;
    case "EVENT_REMINDER":
      return <Calendar className="w-4 h-4" />;
    case "BOOKING_CONFIRMED":
      return <Calendar className="w-4 h-4 text-green-500" />;
    case "PAYOUT_APPROVED":
    case "PAYOUT_REJECTED":
      return <CreditCard className="w-4 h-4" />;
    case "INVITE_APPROVED":
    case "INVITE_REJECTED":
      return <UserCheck className="w-4 h-4" />;
    case "GENERAL":
      return <Bell className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "DATING_KYC_APPROVED":
    case "BOOKING_CONFIRMED":
    case "PAYOUT_APPROVED":
    case "INVITE_APPROVED":
      return "text-green-600";
    case "DATING_KYC_REJECTED":
    case "PAYOUT_REJECTED":
    case "INVITE_REJECTED":
      return "text-red-600";
    case "NEW_MATCH":
      return "text-red-500";
    case "NEW_MESSAGE":
      return "text-blue-600";
    case "GENERAL":
      return "text-purple-600";
    default:
      return "text-gray-600";
  }
};

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=10");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications/unread-count");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll for unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative hover:bg-white/10 rounded-full transition-all duration-200",
            className
          )}
        >
          <Bell className="h-5 w-5 text-white" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium bg-red-500 border-2 border-white"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 bg-white border-gray-200 shadow-xl rounded-2xl"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={isLoading}
                className="text-xs text-[#b81ce3] hover:text-[#b81ce3]/80 hover:bg-[#b81ce3]/5 h-auto p-1"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </DropdownMenuLabel>

        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "p-4 cursor-pointer transition-colors flex items-start gap-3 border-l-4 hover:bg-gray-50",
                    notification.isRead
                      ? "border-l-transparent bg-white"
                      : "border-l-[#b81ce3] bg-[#b81ce3]/5"
                  )}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }

                    // Handle link clicks for GENERAL notifications
                    if (
                      notification.data?.linkUrl &&
                      notification.type === "GENERAL"
                    ) {
                      window.open(notification.data.linkUrl, "_blank");
                    }
                  }}
                >
                  <div
                    className={cn(
                      "flex-shrink-0 p-2 rounded-full",
                      notification.isRead ? "bg-gray-100" : "bg-[#b81ce3]/10"
                    )}
                  >
                    <div className={getNotificationColor(notification.type)}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4
                        className={cn(
                          "text-sm truncate",
                          notification.isRead
                            ? "text-gray-700"
                            : "text-gray-900 font-medium"
                        )}
                      >
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-[#b81ce3] rounded-full flex-shrink-0 ml-2 mt-1" />
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-xs mt-1 line-clamp-2",
                        notification.isRead ? "text-gray-500" : "text-gray-600"
                      )}
                    >
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      {notification.data?.linkUrl &&
                        notification.type === "GENERAL" && (
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-[#b81ce3] hover:text-[#b81ce3]/80 hover:bg-[#b81ce3]/5 text-sm"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page if you have one
                  // router.push('/notifications');
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
