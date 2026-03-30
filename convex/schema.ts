import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // One document per Clerk user, created on first login.
  users: defineTable({
    // Stable Clerk identity key — always use this for ownership lookups.
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(), // Unix timestamp (ms)
    lastLogin: v.optional(v.number()), // Unix timestamp (ms) — updated on every sign-in
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  // One document per journal entry.
  // Multiple entries per day are supported because createdAt stores full
  // millisecond timestamp.
  journalEntries: defineTable({
    userId: v.id("users"),
    title: v.string(),                  // Journal entry title
    content: v.string(),                // Main content of the journal entry
    createdAt: v.number(),              // Unix timestamp (ms) — used for date+time ordering

    // AI mood analysis fields (populated later after each journal entry is created and posted)
    moodLabel: v.optional(v.string()),   // "Happy", "Anxious", "Sad", etc.
    moodScore: v.optional(v.number()),   // -100.0 to 0.0 to 100.0 {negative: unhappy/negative mood, positive: happy/positive mood}
    moodInsight: v.optional(v.string()), // Short AI-generated insight
    analysedAt: v.optional(v.number()),  // When the analysis was last run
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),
});
