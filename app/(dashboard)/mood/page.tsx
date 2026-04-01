// Mood insights page - shows insights about the user's mood patterns over time, based on the AI analysis 
// of their journal entries. This page will query the Convex backend for the user's journal entries, 
// extract the mood analysis results, and display them in a user-friendly format. The mood insight and 
// the moode lable will be displayed in a tanle together with the title of the journal entry, whilst the 
// mood score will be shown in the form of a plotted graph to show the user's mood trends over time. The 
// user is able to choose between last day, last seven days or last month(30 days) time frame for the graph. 
// At the top of the graph the average mood score for the selected time frame will be displayed. This page will 
// help users understand their emotional patterns and gain insights into their mental well-being based on their 
// journal entries.
'use client';

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// Define the possible time frames for mood analysis
type TimeFrame = 1 | 7 | 30;

// Mapping of time frame values to display labels
const TIME_FRAME_LABELS: Record<TimeFrame, string> = {
  1: "Last 24 hours",
  7: "Last 7 days",
  30: "Last 30 days",
};

// Helper function to determine text color based on mood score
function scoreColour(score: number) {
  if (score >= 50) return "text-green-500";
  if (score >= 0) return "text-yellow-500";
  return "text-red-500";
}

// Main component for the Mood Analysis page
export default function MoodPage() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(7);
  const allEntries = useQuery(api.journals.listUserStoredEntries);

  // Filter to analysed entries within the selected time frame, sorted oldest→newest for the graph
  const filteredEntries = useMemo(() => {
    if (!allEntries) return [];
    const now = new Date().getTime();
    const cutoff = now - timeFrame * 24 * 60 * 60 * 1000;
    return allEntries
      .filter(
        (e) =>
          e.moodScore !== undefined &&
          e.moodLabel !== undefined &&
          e.createdAt >= cutoff
      )
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [allEntries, timeFrame]);

  // Average mood score for the selected time frame
  const averageScore = useMemo(() => {
    if (filteredEntries.length === 0) return null;
    const sum = filteredEntries.reduce((acc, e) => acc + (e.moodScore ?? 0), 0);
    return Math.round(sum / filteredEntries.length);
  }, [filteredEntries]);

  // Data points for recharts LineChart
  const chartData = filteredEntries.map((e) => ({
    date: new Date(e.createdAt).toLocaleDateString("en-ZA", {
      month: "short",
      day: "numeric",
    }),
    score: e.moodScore,
    label: e.moodLabel,
  }));

  const isLoading = allEntries === undefined;
  const hasData = filteredEntries.length > 0;

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-12 px-16 bg-white dark:bg-black">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          Mood Analysis
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Your emotional trends based on AI analysis of your journal entries.
        </p>

        {/* Time frame selector */}
        <div className="flex gap-2 mb-8">
          {([1, 7, 30] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                timeFrame === tf
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {TIME_FRAME_LABELS[tf]}
            </button>
          ))}
        </div>

        {isLoading && (
          <p className="text-gray-500 dark:text-gray-400">Loading mood data...</p>
        )}

        {!isLoading && !hasData && (
          <p className="text-gray-500 dark:text-gray-400">
            No analysed entries found for this time frame. Write a journal entry to get started!
          </p>
        )}

        {!isLoading && hasData && (
          <>
            {/* Average score banner */}
            <div className="mb-8 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Average mood score — {TIME_FRAME_LABELS[timeFrame]}
              </p>
              <p className={`text-4xl font-bold ${scoreColour(averageScore ?? 0)}`}>
                {averageScore !== null
                  ? averageScore > 0
                    ? `+${averageScore}`
                    : `${averageScore}`
                  : "—"}
                <span className="text-base font-normal text-gray-400 ml-1">/ 100</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Based on {filteredEntries.length} journal{" "}
                {filteredEntries.length === 1 ? "entry" : "entries"}
              </p>
            </div>

            {/* Mood score line chart */}
            <div className="mb-10 p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4 uppercase tracking-wide">
                Mood score over time
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[-100, 100]}
                    ticks={[-100, -50, 0, 50, 100]}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [
                      typeof value === "number" ? `${value > 0 ? "+" : ""}${value}` : value,
                      "Mood score",
                    ]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                  />
                  {/* Zero reference line — neutral mood */}
                  <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="4 4" />
                  {/* Average mood reference line */}
                  {averageScore !== null && (
                    <ReferenceLine
                      y={averageScore}
                      stroke="#3b82f6"
                      strokeDasharray="4 4"
                      label={{ value: "avg", position: "right", fontSize: 10, fill: "#3b82f6" }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Entry insights table — newest first */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">Mood</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">AI Insight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {[...filteredEntries].reverse().map((entry) => (
                    <tr key={entry._id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString("en-ZA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200 font-medium">
                        {entry.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${scoreColour(entry.moodScore ?? 0)}`}>
                          {entry.moodLabel}
                        </span>
                        <span className="ml-2 text-xs text-gray-400">
                          {entry.moodScore !== undefined
                            ? entry.moodScore > 0
                              ? `+${entry.moodScore}`
                              : `${entry.moodScore}`
                            : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 italic">
                        {entry.moodInsight ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        </main>
    </div>
  );
}