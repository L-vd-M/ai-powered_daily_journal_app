// This is the main journal page where users can write and post their journal entries. 
// It includes a textarea for input and a button to submit the entry, which calls the 
// `createJournalEntry` mutation to save it in the database.
'use client';

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";

export default function JournalPage() {
  const [content, setContent] = useState("");
  const createJournalEntry = useMutation(api.journals.createJournalEntry);

  async function handlePost() {
    if (!content.trim()) return;
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
    await createJournalEntry({
      title: `Journal Entry - ${today}`,
      content: content.trim(),
    });
    setContent("");
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        {/* Textbox for entering journal entry */}
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          placeholder="Write your journal entry here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* Post button — calls createJournalEntry mutation on click */}
        <div className="flex mt-5 items-center justify-center">
          <Button onClick={handlePost} disabled={!content.trim()}>
            Post to Journal
          </Button>
        </div>
      </main>
    </div>
  );
}
