// Service Worker for handling push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || "You have a new notification",
      icon: data.icon || "/icon-192x192.png",
      badge: data.badge || "/badge-72x72.png",
      tag: data.tag || "notification",
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
      data: {
        url: data.url || "/dashboard/journal",
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Journal Reminder", options)
    );
  } catch (error) {
    console.error("Error handling push notification:", error);
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;

  if (action === "open-journal" || !action) {
    // Open journal page in a new window or existing one
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // Check if journal page is already open
        for (const client of clientList) {
          if (
            client.url.includes("/dashboard/journal") &&
            "focus" in client
          ) {
            return client.focus();
          }
        }
        // If not open, open in new window
        if (clients.openWindow) {
          return clients.openWindow(notificationData.url || "/dashboard/journal");
        }
      })
    );
  } else if (action === "close") {
    // Just close the notification (already done above)
  }
});

// Handle notification dismissal
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag);
});
