"use client";

import { initializeApp, getApps } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messaging: Messaging | null = null;

// Initialize messaging only on client-side and in browser context
export const getMessagingInstance = () => {
  if (typeof window !== "undefined" && !messaging) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.error("Error initializing Firebase messaging:", error);
    }
  }
  return messaging;
};

// Generate FCM token (only if permission is already granted)
export const generateToken = async (): Promise<string | null> => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) {
      console.error("Firebase messaging not available");
      return null;
    }

    // Check if permission is already granted
    if (Notification.permission !== "granted") {
      console.log("Notification permission not granted");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
    });

    if (token) {
      console.log("FCM Token generated:", token);
      return token;
    } else {
      console.log("No registration token available");
      return null;
    }
  } catch (error) {
    console.error("Error generating FCM token:", error);
    return null;
  }
};

// Generate FCM token with permission request (for initial setup)
export const generateTokenWithPermission = async (): Promise<string | null> => {
  try {
    const messaging = getMessagingInstance();
    if (!messaging) {
      console.error("Firebase messaging not available");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
    });

    if (token) {
      console.log("FCM Token generated:", token);
      return token;
    } else {
      console.log("No registration token available");
      return null;
    }
  } catch (error) {
    console.error("Error generating FCM token:", error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = () => {
  const messaging = getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    console.log("Message received in foreground:", payload);

    // Create a custom notification for foreground messages
    if (payload.notification) {
      const { title, body, icon } = payload.notification;

      // Show browser notification
      if (Notification.permission === "granted") {
        new Notification(title || "New Notification", {
          body: body || "",
          icon: icon || "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          tag: "molle-notification",
          requireInteraction: true,
        });
      }
    }
  });
};

export { app };
