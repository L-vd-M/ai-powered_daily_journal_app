"use client";

import { useState } from "react";

// Video: https://www.youtube.com/watch?v=lE6RYpe9IT0&list=RDlE6RYpe9IT0
// Embedded using youtube-nocookie.com (privacy-enhanced mode — no cookies until user interacts)
const VIDEO_ID = "lE6RYpe9IT0";
const LIST_ID = "RDlE6RYpe9IT0";

const EMBED_SRC =
  `https://www.youtube-nocookie.com/embed/${VIDEO_ID}` +
  `?list=${LIST_ID}` +
  `&autoplay=1` +
  `&mute=1` +
  `&loop=1` +
  `&playlist=${VIDEO_ID}` + // required for loop=1 to work
  `&controls=1` +
  `&rel=0` +
  `&modestbranding=1`;

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
            — starts muted, click 🔊 to unmute
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
          />
        </div>
      )}
    </div>
  );
}
