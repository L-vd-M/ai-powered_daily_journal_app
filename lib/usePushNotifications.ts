/**
 * Hook for managing web push notifications.
 * Handles registration, subscription, and unsubscription.
 */

import { useEffect, useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subscribeToPush = useMutation(api.users.subscribeToPush);
  const unsubscribeFromPush = useMutation(api.users.unsubscribeFromPush);

  // Check browser support on mount
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setIsSupported(supported);

    if (supported) {
      checkSubscriptionStatus();
    } else {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to check subscription status"
      );
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError("Push notifications not supported in this browser");
      return;
    }

    try {
      setIsLoading(true);

      // Request notification permission
      if (Notification.permission === "denied") {
        setError("Notification permission denied");
        return;
      }

      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setError("Notification permission denied by user");
          return;
        }
      }

      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.register(
        "/service-worker.js"
      );

      // Get VAPID public key from environment or server
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError("VAPID public key not configured");
        return;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          vapidPublicKey
        ) as unknown as BufferSource,
      });

      // Save subscription to database
      await subscribeToPush({
        subscription: JSON.parse(JSON.stringify(subscription)),
      });

      setIsSubscribed(true);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to subscribe to notifications";
      setError(message);
      console.error("Push subscription error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, subscribeToPush]);

  const unsubscribe = useCallback(async () => {
    try {
      setIsLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove subscription from database
      await unsubscribeFromPush();

      setIsSubscribed(false);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to unsubscribe from notifications";
      setError(message);
      console.error("Push unsubscribe error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [unsubscribeFromPush]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  };
}

/**
 * Converts a base64url string to a Uint8Array for use with Push API.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
