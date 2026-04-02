'use client';

import { useState, useEffect } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

export default function JournalPage() {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "analysing" | "done">("idle");
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Tick the cooldown countdown every second
  useEffect(() => {
    if (!cooldownUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setCooldownUntil(null);
        setCooldownRemaining(0);
      } else {
        setCooldownRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const createJournalEntry = useMutation(api.journals.createJournalEntry);
  const analyseMood = useAction(api.ai.analyseMoodForEntry);
  const clearReminder = useMutation(api.users.clearPendingReminder);

  async function handlePost() {
    if (!content.trim()) return;
    if (cooldownUntil && Date.now() < cooldownUntil) return;
    const trimmed = content.trim();

    const todayDate = new Date().toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const currentTime = new Date().toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const today = `${todayDate} at ${currentTime}`;

    try {
      setStatus("saving");
      const entryId = await createJournalEntry({
        title: `Journal Entry - ${today}`,
        content: trimmed,
      });

      setStatus("analysing");
      await analyseMood({ entryId, content: trimmed });

      // Clear the reminder flag since user has now journaled
      await clearReminder();

      setContent("");
      setStatus("done");
      setCooldownUntil(Date.now() + 2 * 60 * 1000);
      setCooldownRemaining(120);
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("idle");
    }
  }

  const isLoading = status === "saving" || status === "analysing";
  const isCooldown = cooldownRemaining > 0;

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-12 px-16 bg-white dark:bg-black">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          New Journal Entry
        </h1>

        {/* Textbox for entering journal entry */}
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
          placeholder="Write your journal entry here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
        />

        {/* Status feedback */}
        {status === "saving" && (
          <p className="mt-3 text-sm text-blue-500">Saving your entry...</p>
        )}
        {status === "analysing" && (
          <p className="mt-3 text-sm text-purple-500">Analysing mood with AI...</p>
        )}
        {status === "done" && (
          <p className="mt-3 text-sm text-green-500">Entry saved and mood analysed!</p>
        )}

        {/* "Post to Journal" button — rate-limited to one post every 2 minutes */}
        <div className="flex flex-col mt-5 items-center justify-center gap-2">
          <Button onClick={handlePost} disabled={!content.trim() || isLoading || isCooldown}>
            {isLoading
              ? "Processing..."
              : isCooldown
              ? `Please wait ${cooldownRemaining}s...`
              : "Post to Journal"}
          </Button>
          {isCooldown && (
            <p className="text-xs text-gray-400">
              You can post again in {Math.floor(cooldownRemaining / 60)}m{" "}
              {cooldownRemaining % 60}s
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
