// Import Firebase scripts for service worker
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyCbFCteCBFyxc9ROV9_RkMQ2c5yNtWnFg8",
  authDomain: "mollee-cd511.firebaseapp.com",
  projectId: "mollee-cd511",
  storageBucket: "mollee-cd511.firebasestorage.app",
  messagingSenderId: "864375996979",
  appId: "1:864375996979:web:346ecaf1a9bb31fb27d946",
  measurementId: "G-ZZGW4J7NJV",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload);

  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: payload.notification?.icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: "molle-notification",
    requireInteraction: true,
    data: {
      ...payload.data,
      url: payload.data?.link || payload.fcmOptions?.link || "/",
    },
    actions: [
      {
        action: "view",
        title: "View",
        icon: "/icons/icon-96x96.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  let urlToOpen = event.notification.data?.url || "/";

  if (event.notification.data?.type === "DATING_KYC_APPROVED") {
    urlToOpen = "/dashboard/social/discover";
  }

  // Open the app or focus existing tab
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }

        // Open new window/tab
        if (clients.openWindow) {
          const baseUrl = self.location.origin;
          return clients.openWindow(baseUrl + urlToOpen);
        }
      })
  );
});

// Handle notification close events
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event);

  // Track notification dismissal if needed
  if (event.notification.data?.trackDismissal) {
    // Send analytics event
    fetch("/api/analytics/notification-dismissed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationId: event.notification.tag,
        timestamp: Date.now(),
      }),
    }).catch(console.error);
  }
});
