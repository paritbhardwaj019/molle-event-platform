"use client";

import { useEffect, useState } from "react";
import {
  generateToken,
  generateTokenWithPermission,
  onForegroundMessage,
} from "@/lib/firebase";
import { toast } from "sonner";

interface PushNotificationManagerProps {
  userId?: string;
}

export function PushNotificationManager({
  userId,
}: PushNotificationManagerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator
    ) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  // Listen for permission changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkPermission = () => {
      if (Notification.permission !== permission) {
        setPermission(Notification.permission);
      }
    };

    // Check periodically for permission changes
    const interval = setInterval(checkPermission, 1000);

    return () => clearInterval(interval);
  }, [permission]);

  useEffect(() => {
    if (!isSupported || !userId || permission !== "granted") return;

    const initializePushNotifications = async () => {
      try {
        // Generate FCM token only if permission is granted
        const token = await generateToken();
        if (token) {
          // Save token to backend
          await fetch("/api/notifications/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          });

          console.log("FCM token saved successfully");
        }

        // Set up foreground message listener
        const unsubscribe = onForegroundMessage();
        return () => {
          if (typeof unsubscribe === "function") {
            unsubscribe();
          }
        };
      } catch (error) {
        console.error("Error initializing push notifications:", error);
      }
    };

    initializePushNotifications();
  }, [isSupported, permission, userId]);

  // Handle visibility change to refresh token when app comes to foreground
  useEffect(() => {
    if (!isSupported || !userId || permission !== "granted") return;

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        try {
          const token = await generateToken();
          if (token) {
            await fetch("/api/notifications/token", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token }),
            });
          }
        } catch (error) {
          console.error("Error refreshing FCM token:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSupported, userId, permission]);

  // Show notification permission prompt for PWA users
  const requestPermission = async () => {
    if (!isSupported) {
      toast.error("Push notifications are not supported in this browser");
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);

      // Use the new function that handles permission request
      const token = await generateTokenWithPermission();

      // Update permission state immediately
      setPermission(Notification.permission);

      if (Notification.permission === "granted") {
        toast.success("Push notifications enabled!");

        // Save token if generated
        if (token) {
          await fetch("/api/notifications/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          });
          console.log("FCM token saved after permission grant");
        }
      } else {
        toast.error("Push notifications permission denied");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Failed to enable push notifications");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything if notifications are already granted, not supported, dismissed, or no user
  if (!isSupported || permission === "granted" || !userId || isDismissed) {
    return null;
  }

  // Show permission prompt for denied or default state
  if (permission === "denied") {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 p-4 bg-background border rounded-lg shadow-lg max-w-sm mx-auto">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🔔</div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Notifications Blocked</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Enable notifications in your browser settings to receive updates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 p-4 bg-background border rounded-lg shadow-lg max-w-sm mx-auto">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">🔔</div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Stay Updated</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Get instant notifications about your dating profile and matches.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={requestPermission}
              disabled={isLoading}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Enabling..." : "Enable"}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs rounded-md font-medium hover:bg-muted disabled:opacity-50"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
