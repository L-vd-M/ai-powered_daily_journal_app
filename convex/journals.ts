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
