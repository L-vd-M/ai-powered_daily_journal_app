// This page displays a list of the user's previous journal entries. It uses 
// the `listUserStoredEntries` query to fetch the entries from the database and 
// renders them in a table format. It also handles loading and empty states gracefully.
'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function JournalViewPage() {
  const entries = useQuery(api.journals.listUserStoredEntries);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-12 px-16 bg-white dark:bg-black">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          Previous Journal Entries
        </h1>

        {/* Loading state */}
        {entries === undefined && (
          <p className="text-gray-500 dark:text-gray-400">Loading entries...</p>
        )}

        {/* Empty state */}
        {entries !== undefined && entries.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400">
            No journal entries yet. Start writing!
          </p>
        )}

        {/* Entries table */}
        {entries !== undefined && entries.length > 0 && (
          <table className="w-full mt-2 border-collapse border border-gray-300 dark:border-gray-600">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left w-40">
                  {/* Date and Time */}
                  Date
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">
                  Entry
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 align-top text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleDateString("en-ZA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      // hour: "2-digit",
                      // minute: "2-digit",
                    })}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-800 dark:text-gray-200">
                    <p className="font-medium text-sm mb-1">{entry.title}</p>
                  {/* </td> */}
                  {/* <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-800 dark:text-gray-200"></td> */}
                    <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}