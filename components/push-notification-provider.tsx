"use client";

import { useEffect, useState } from "react";
import { PushNotificationManager } from "./push-notification-manager";

export function PushNotificationProvider() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user session
    const fetchUserSession = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data.user?.id) {
            setUserId(data.user.id);
          }
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
      }
    };

    fetchUserSession();
  }, []);

  if (!userId) {
    return null;
  }

  return <PushNotificationManager userId={userId} />;
}


