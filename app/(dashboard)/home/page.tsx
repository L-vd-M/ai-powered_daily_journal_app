'use client';

import Link from "next/link";
import YoutubeAmbientPlayer from "@/components/YoutubeAmbientPlayer";
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function HomePage() {
  const user = useQuery(api.users.getUserName);
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-12 px-16 bg-white dark:bg-black gap-8">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          {/* Personalized greeting */}
          Welcome back {user ?? "user"}!
        </h1>

        {/* Ambient music player — loops the selected YouTube mix, starts muted */}
        <YoutubeAmbientPlayer />

        <Link
          href="/journal"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          ✍️ Write Today&apos;s Entry
        </Link>
      </main>
    </div>
  );
}