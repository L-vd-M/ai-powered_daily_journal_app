import { ClerkLoaded, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {/* Navigation Links - Top Bar */ }
          <div className="flex gap-8 items-center">

            {/* Home link to dashboard main page */ }
            <Link href="/home" className="font-semibold text-blue-600 hover:text-blue-700">
              Home
            </Link>

            {/* Provides the user with a page to create a new journal entry for the current day/ time */}
            <Link href="/journal" className="text-gray-600 hover:text-gray-900">
              New Journal Entry
            </Link>

            {/* Provides the user with a page to view their previous journal entries in a list or calendar format */ }
            <Link href="/journal_view" className="text-gray-600 hover:text-gray-900">
              Previous Journal Entries
            </Link>

            {/* Provides the user with a mood analysis page where they can see insights about their mood patterns over time */}
            <Link href="/mood" className="text-gray-600 hover:text-gray-900">
              Mood Analysis
            </Link>
          </div>
          
          {/* User Menu */}
          <ClerkLoaded>
            <UserButton />
          </ClerkLoaded>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}