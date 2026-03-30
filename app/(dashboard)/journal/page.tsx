'use client';

import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

export default function JournalPage() {
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "analysing" | "done">("idle");

  const createJournalEntry = useMutation(api.journals.createJournalEntry);
  const analyseMood = useAction(api.ai.analyseMoodForEntry);

  async function handlePost() {
    if (!content.trim()) return;
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

      setContent("");
      setStatus("done");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("idle");
    }
  }

  const isLoading = status === "saving" || status === "analysing";

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

        {/* Clear Textbox and reset status after a short delay */}
        {/* <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
          placeholder="Write your journal entry here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
        /> */}

        {/* Post button */}
        <div className="flex mt-5 items-center justify-center">
          <Button onClick={handlePost} disabled={!content.trim() || isLoading}>
            {isLoading ? "Processing..." : "Post to Journal"}
          </Button>
        </div>
      </main>
    </div>
  );
}
