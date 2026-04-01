/**
 * DashboardClient Component
 * Handles client-side functionality for the dashboard:
 * - Displays reminder banner
 * - Manages push notification subscription
 * - Clears reminder flag after entry creation
 */

"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ReminderBanner } from "@/components/ReminderBanner";
import { usePushNotifications } from "@/lib/usePushNotifications";

interface DashboardClientProps {
  children: React.ReactNode;
}

export function DashboardClient({ children }: DashboardClientProps) {
  const currentUser = useQuery(api.users.getUserDocuments);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);

  const {
    isSupported: isPushSupported,
    isSubscribed,
    isLoading: isPushLoading,
    subscribe,
    error: pushError,
  } = usePushNotifications();

  // Show push notification opt-in prompt once
  useEffect(() => {
    if (isPushSupported && !isSubscribed && !isPushLoading) {
      // Check if user has previously declined
      const hasDeclinedPush = localStorage.getItem("push_notification_declined");
      if (!hasDeclinedPush) {
        const timer = setTimeout(() => {
          setShowPushPrompt(true);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [isPushSupported, isSubscribed, isPushLoading]);

  const handleEnablePush = async () => {
    await subscribe();
    setShowPushPrompt(false);
  };

  const handleDeclinePush = () => {
    localStorage.setItem("push_notification_declined", "true");
    setShowPushPrompt(false);
  };

  const handleReminderDismiss = () => {
    setReminderDismissed(true);
  };

  const showReminder =
    currentUser?.pendingReminder === true &&
    !reminderDismissed;

  return (
    <>
      {/* Reminder Banner */}
      <ReminderBanner
        isVisible={showReminder}
        runLabel={(currentUser?.lastReminderRunLabel ?? "morning") as "morning" | "evening"}
        onDismiss={handleReminderDismiss}
      />

      {/* Push Notification Opt-In Prompt */}
      {showPushPrompt && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-30">
          <h3 className="font-semibold text-gray-900 mb-2">
            Get Reminder Notifications
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Enable browser notifications so you don&apos;t miss your daily journal reminders.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnablePush}
              disabled={isPushLoading}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 text-sm font-medium"
            >
              {isPushLoading ? "Enabling..." : "Enable"}
            </button>
            <button
              onClick={handleDeclinePush}
              className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded hover:bg-gray-300 text-sm font-medium"
            >
              Skip
            </button>
          </div>
          {pushError && (
            <p className="text-xs text-red-500 mt-2">{pushError}</p>
          )}
        </div>
      )}

      {/* Main content */}
      {children}
    </>
  );
}
