/**
 * DashboardClient Component
 * Handles client-side functionality for the dashboard:
 * - Displays reminder banner
 * - Manages push notification subscription
 * - Clears reminder flag after entry creation
 */

"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ReminderBanner } from "@/components/ReminderBanner";

interface DashboardClientProps {
  children: React.ReactNode;
}

export function DashboardClient({ children }: DashboardClientProps) {
  const currentUser = useQuery(api.users.getUserDocuments);
  const [reminderDismissed, setReminderDismissed] = useState(false);

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

      {/* Main content */}
      {children}
    </>
  );
}
