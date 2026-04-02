"use client";

import { useState } from "react";

// Video: https://www.youtube.com/watch?v=lE6RYpe9IT0&list=RDlE6RYpe9IT0
// Embedded using youtube-nocookie.com (privacy-enhanced mode — no cookies until user interacts)
const LIST_ID = "PLYwFNfjiOd7OfNspQIk1AfKFvc7dTVuzt";
const WATCH_URL = `https://www.youtube.com/playlist?list=${LIST_ID}`;

// Build the embed URL as a plain constant — no window.location access needed.
// The `origin` param is omitted intentionally to avoid SSR/client hydration mismatches.
const EMBED_SRC =
  `https://www.youtube.com/embed/videoseries` +
  `?list=${LIST_ID}` +
  `&autoplay=1` +
  `&mute=1` +
  `&loop=1` +
  `&playsinline=1` +
  `&controls=1` +
  `&rel=0` +
  `&modestbranding=1` +
  `&enablejsapi=1`;

export default function YoutubeAmbientPlayer() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <span className="text-base">🎵</span>
          <span>Ambient Sounds</span>
          <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
            — video starts as muted, click 🔊 to unmute
          </span>
        </div>
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
          aria-label={collapsed ? "Expand player" : "Collapse player"}
        >
          {collapsed ? "▶ Show" : "▼ Hide"}
        </button>
      </div>

      {/* Player */}
      {!collapsed && (
        <div className="relative w-full" style={{ paddingBottom: "56.25%" /* 16:9 */ }}>
          <iframe
            src={EMBED_SRC}
            title="Ambient background music"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            referrerPolicy="strict-origin-when-cross-origin"
          />

          {/* If YouTube blocks embedding for the selected media, users can open it directly. */}
          <a
            href={WATCH_URL}
            target="_blank"
            rel="noreferrer"
            className="absolute right-3 bottom-3 rounded-md bg-black/70 px-2 py-1 text-xs text-white hover:bg-black/85 transition-colors"
          >
            Open on YouTube
          </a>
        </div>
      )}
    </div>
  );
}
