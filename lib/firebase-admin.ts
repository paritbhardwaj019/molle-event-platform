"use server";

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

// Initialize Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  if (getApps().length === 0) {
    try {
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID!,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID!,
        private_key: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL!,
        client_id: process.env.FIREBASE_CLIENT_ID!,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
      };

      initializeApp({
        credential: cert(serviceAccount as any),
        projectId: process.env.FIREBASE_PROJECT_ID!,
      });
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error);
    }
  }
};

// Send push notification (for individual notifications)
export const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
  imageUrl,
  userId,
  createInAppNotification = false,
}: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  userId?: string;
  createInAppNotification?: boolean;
}) => {
  try {
    initializeFirebaseAdmin();
    const messaging = getMessaging();

    const message = {
      token,
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      webpush: {
        fcmOptions: {
          link:
            data.link ||
            process.env.NEXT_PUBLIC_APP_URL ||
            "https://molle.events",
        },
        notification: {
          title,
          body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          tag: "molle-notification",
          requireInteraction: true,
          actions: [
            {
              action: "view",
              title: "View",
            },
            {
              action: "dismiss",
              title: "Dismiss",
            },
          ],
        },
      },
    };

    const response = await messaging.send(message);
    console.log("Push notification sent successfully:", response);

    // Create in-app notification if requested and userId is provided
    if (createInAppNotification && userId) {
      try {
        const { createNotification } = await import(
          "@/lib/actions/notifications"
        );
        await createNotification({
          title,
          message: body,
          type: "GENERAL",
          userId,
          data: {
            imageUrl,
            linkUrl: data.link,
            type: data.type || "PUSH_NOTIFICATION",
          },
        });
        console.log("In-app notification created successfully");
      } catch (inAppError) {
        console.error("Failed to create in-app notification:", inAppError);
        // Don't fail the push notification if in-app creation fails
      }
    }

    return { success: true, messageId: response };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Send notification to multiple tokens
export const sendBulkPushNotifications = async ({
  tokens,
  title,
  body,
  data = {},
  imageUrl,
}: {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}) => {
  try {
    initializeFirebaseAdmin();
    const messaging = getMessaging();

    const message = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: {
        ...data,
        timestamp: Date.now().toString(),
      },
      webpush: {
        fcmOptions: {
          link:
            data.link ||
            process.env.NEXT_PUBLIC_APP_URL ||
            "https://molle.events",
        },
        notification: {
          title,
          body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          tag: "molle-notification",
          requireInteraction: true,
        },
      },
      tokens,
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log(
      `Bulk notification sent to ${response.successCount}/${tokens.length} devices`
    );

    // Collect invalid tokens for cleanup
    const invalidTokens: string[] = [];

    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          const isInvalidToken =
            errorCode === "messaging/registration-token-not-registered" ||
            errorCode === "messaging/invalid-registration-token" ||
            resp.error?.message?.includes("Requested entity was not found");

          if (isInvalidToken) {
            invalidTokens.push(tokens[idx]);
            console.log(`Invalid token detected: ${tokens[idx]}`);
          } else {
            console.error(
              `Failed to send to token ${tokens[idx]}:`,
              resp.error
            );
          }
        }
      });
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
      invalidTokens,
    };
  } catch (error) {
    console.error("Error sending bulk push notifications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
