import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Welcome back!</h1>

      <Link
        href="/journal"
        className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
      >
        ✍️ Write Today&apos;s Entry
      </Link>
    </div>
  );
}