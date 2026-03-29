import type { ReactNode } from "react";

// Auth layout (dark hero bg, centered)
export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <main className="w-full max-w-md p-6 bg-zinc-900 rounded-lg shadow-md">
        {children}
      </main>
    </div>
  );
}