// This component ensures that the authenticated Clerk user has a corresponding record in the Convex `users` table.
// It calls the `upsertUser` mutation on every protected page load, but the mutation is idempotent 
// (it patches if the user already exists).
"use client";

import { useEffect } from "react";
import { useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Invisible component — renders nothing but calls `upsertUser` once per session
 * to ensure the authenticated Clerk user has a matching record in the Convex
 * `users` table. Runs on every protected page load, but the mutation is
 * idempotent (it patches if the user already exists).
 *
 * Uses useConvexAuth() rather than Clerk's useAuth() so the mutation only fires
 * after Convex has received and verified the JWT — eliminating the race condition
 * where Clerk reports isSignedIn=true before the token reaches Convex.
 */
export function UserSync() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const upsertUser = useMutation(api.users.upsertUser);

  useEffect(() => {
    console.log("[UserSync] isLoading:", isLoading, "isAuthenticated:", isAuthenticated);
    if (isAuthenticated) {
      console.log("[UserSync] calling upsertUser...");
      upsertUser()
        .then(() => console.log("[UserSync] upsertUser succeeded"))
        .catch((err) => console.error("[UserSync] upsertUser failed:", err));
    }
  }, [isLoading, isAuthenticated, upsertUser]);

  return null;
}
