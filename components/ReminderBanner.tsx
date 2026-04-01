/**
 * ReminderBanner Component
 * Displays an in-app notification banner when a reminder has been triggered.
 * Shows actionable prompts to write a journal entry or dismiss.
 */

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

interface ReminderBannerProps {
  isVisible: boolean;
  runLabel?: "morning" | "evening";
  onDismiss?: () => void;
}

export function ReminderBanner({
  isVisible,
  runLabel = "morning",
  onDismiss,
}: ReminderBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const clearReminder = useMutation(api.users.clearPendingReminder);

  if (!isVisible || dismissed) {
    return null;
  }

  const handleDismiss = async () => {
    setDismissed(true);
    await clearReminder();
    onDismiss?.();
  };

  const title =
    runLabel === "morning"
      ? "☀️ Good morning! Time to journal"
      : "🌙 Evening reflection time";

  const description =
    runLabel === "morning"
      ? "Start your day by reflecting on how you're feeling."
      : "Take a moment to capture your thoughts from today.";

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-blue-100 text-sm">{description}</p>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Link href="/journal">
              <Button
                size="sm"
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                Write Entry
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-blue-700"
              onClick={handleDismiss}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
