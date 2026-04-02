"use client";

import { useMemo, useState } from "react";

// Video: https://www.youtube.com/watch?v=lE6RYpe9IT0&list=RDlE6RYpe9IT0
// Embedded using youtube-nocookie.com (privacy-enhanced mode — no cookies until user interacts)
const LIST_ID = "PLYwFNfjiOd7OfNspQIk1AfKFvc7dTVuzt";
const WATCH_URL = `https://www.youtube.com/playlist?list=${LIST_ID}`;

export default function YoutubeAmbientPlayer() {
  const [collapsed, setCollapsed] = useState(false);
  const embedSrc = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    return (
      `https://www.youtube.com/embed/videoseries` +
      `?list=${LIST_ID}` +  // Specify the playlist to play
      `&autoplay=1` +       // Start playing automatically
      `&mute=1` +           // Start muted (important for autoplay to work without user interaction in most browsers) 
      `&loop=1` +           // Loop the playlist (note: YouTube's loop for playlists only works if the playlist contains more than one video)
      `&playsinline=1` +    // Play inline on mobile devices instead of going fullscreen
      `&controls=1` +       // Show player controls so users can pause/unmute if they want (important for UX and accessibility)
      `&rel=0` +            // Don’t show related videos at the end (note: YouTube may still show related videos from the same channel)
      `&modestbranding=1` + // Minimize YouTube branding
      `&enablejsapi=1` +    // Enable JavaScript API for further control
      (origin ? `&origin=${encodeURIComponent(origin)}` : "")
    );
  }, []);

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
            src={embedSrc}
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
