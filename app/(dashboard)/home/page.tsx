import Link from "next/link";

export default function HomePage() {
  return (
    // <div className="flex flex-col gap-6">
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-12 px-16 bg-white dark:bg-black">
        {/* <h1 className="text-3xl font-bold"> */}
        <h1 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          Welcome back!
        </h1>

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