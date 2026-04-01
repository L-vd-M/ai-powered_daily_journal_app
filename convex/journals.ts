// This file defines the Convex queries, actions, and mutations related to journal entries. It includes 
// a helper function `requireUser` to ensure that the user is authenticated and has a corresponding 
// record in the `users` table before allowing them to create, update, or delete journal entries. 
// The queries allow fetching all entries for the current user or a specific entry by ID, while 
// the mutations handle creating, updating, and deleting entries owned by the user. 

// libraries
import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// // OpenAI API client setup (for mood analysis)
// import OpenAI from "openai";


// Internal helper — look up the authenticated user's document or throw.
async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique();

  if (!user) throw new Error("User record not found. Please sign out and back in.");
  return user;
}

// ──────────────────────────────────────────────────────────────────────────────
// Mutations
// ──────────────────────────────────────────────────────────────────────────────

// Create a new journal entry for the current user.
export const createJournalEntry = mutation({
  args: {
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("journalEntries", {
      userId: user._id,             // Link entry to current user
      title: args.title,            // Entry title from client
      content: args.content,        // Entry content from client
      createdAt: Date.now(),        // Timestamp for ordering entries by creation time
    });
  },
});

// Update the title and/or content of an entry owned by the current user. [Additional mutation if needed]
export const updateJournalEntry = mutation({
  args: {
    entryId: v.id("journalEntries"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== user._id) throw new Error("Unauthorized");
    await ctx.db.patch(args.entryId, {
      title: args.title,            // Updated title from client
      content: args.content,        // Updated content from client
    });
  },
});

// Delete an entry owned by the current user. [Additional mutation if needed]
export const removeJournalEntry = mutation({
  args: {
    entryId: v.id("journalEntries"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const entry = await ctx.db.get(args.entryId);
    if (!entry || entry.userId !== user._id) throw new Error("Unauthorized");
    await ctx.db.delete(args.entryId); // Delete the entry from the database
  },
});

// ──────────────────────────────────────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────────────────────────────────────

// Return all journal entries for the current user, newest first.
export const listUserStoredEntries = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")                                           // Look up the user document based on the authenticated identity
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("journalEntries")                                   // Query journal entries for the current user
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

// Internal mutation — patches a journalEntry document with AI mood analysis results.
export const saveMoodAnalysis = internalMutation({
  args: {
    entryId: v.id("journalEntries"),
    moodLabel: v.string(),
    moodScore: v.number(),
    moodInsight: v.string(),
    analysedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.entryId, {
      moodLabel: args.moodLabel,
      moodScore: args.moodScore,
      moodInsight: args.moodInsight,
      analysedAt: args.analysedAt,
    });
  },
});

// Return a single entry — only if it belongs to the current user.
export const getJournalEntry = query({
  args: { entryId: v.id("journalEntries") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const entry = await ctx.db.get(args.entryId);
    if (!entry) return null;

    const user = await ctx.db
      .query("users")                                           // Look up the user document based on the authenticated identity
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || entry.userId !== user._id) return null;
    return entry;
  },
});

// Returns the mood scores of the last day as well as a day average for the current user, or null if 
// no entries found.
export const getLastDayMoodScores = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")                                           // Look up the user document based on the authenticated identity
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return null;

    const entries = await ctx.db
      .query("journalEntries")                                   // Query journal entries for the current user
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    if (entries.length === 0) return null;

    const lastDayEntries = entries.filter((entry) => {
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000; // Calculate the timestamp for 24 hours ago
      return entry.createdAt >= oneDayAgo;    // Filter entries to only include those from the last day
    });

    if (lastDayEntries.length === 0) return null;   // If no entries in the last day, return null

    const moodScores = lastDayEntries.map((entry) => entry.moodScore ?? 0);         // Extract mood scores, defaulting to 0 if not analysed yet
    const dayAverage = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;   // Calculate the average mood score for the last day

    return {    // Return both the individual mood scores and the calculated average for the last day
      moodScores,
      dayAverage,
    };
  },
});

// Returns the mood scores of the seven day as well as a day average for the current user, or null if 
// no entries found.
export const getLastSevenDaysMoodScores = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")                                           // Look up the user document based on the authenticated identity
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return null;

    const entries = await ctx.db
      .query("journalEntries")                                   // Query journal entries for the current user
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    if (entries.length === 0) return null;    // If there are no entries at all, return null to indicate no data available

    const lastSevenDaysEntries = entries.filter((entry) => {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;  // Calculate the timestamp for seven days ago
      return entry.createdAt >= sevenDaysAgo;   // Filter entries to only include those from the last seven days
    });

    if (lastSevenDaysEntries.length === 0) return null;

    const moodScores = lastSevenDaysEntries.map((entry) => entry.moodScore ?? 0);         // Extract mood scores, defaulting to 0 if not analysed yet
    const sevenDayAverage = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;   // Calculate the average mood score for the last seven days

    return {    // Return both the individual mood scores and the calculated average for the last seven days
      moodScores,
      sevenDayAverage,
    };
  },
});



// Returns the mood scores of the last month as well as a month average for the current user, or null if 
// no entries found.
export const getLastMonthMoodScores = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")                                           // Look up the user document based on the authenticated identity
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return null;

    const entries = await ctx.db
      .query("journalEntries")                                   // Query journal entries for the current user
      .withIndex("by_userId_and_createdAt", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    if (entries.length === 0) return null;    // If there are no entries at all, return null to indicate no data available

    const lastMonthEntries = entries.filter((entry) => {
      const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;    // Approximate one month as 30 days; Calculate the timestamp for 30 days ago
      return entry.createdAt >= oneMonthAgo;    // Filter entries to only include those from the last month
    });

    if (lastMonthEntries.length === 0) return null;   // If there are no entries in the last month, return null to indicate no data available

    const moodScores = lastMonthEntries.map((entry) => entry.moodScore ?? 0);         // Extract mood scores, defaulting to 0 if not analysed yet
    const monthAverage = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;   // Calculate the average mood score for the last month

    return {    // Return both the individual mood scores and the calculated average for the last month
      moodScores,
      monthAverage,
    };
  },
});