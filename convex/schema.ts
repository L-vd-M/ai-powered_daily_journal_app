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
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  // One document per journal entry.
  // Multiple entries per day are supported because createdAt stores full
  // millisecond timestamp, not just a date.
  journalEntries: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    createdAt: v.number(), // Unix timestamp (ms) — used for date+time ordering

    // Optional AI mood analysis fields (populated later)
    moodLabel: v.optional(v.string()),   // e.g. "Happy", "Anxious"
    moodScore: v.optional(v.number()),   // e.g. 0.0 – 1.0
    moodInsight: v.optional(v.string()), // Short AI-generated insight
    analysedAt: v.optional(v.number()),  // When the analysis was last run
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_createdAt", ["userId", "createdAt"]),
});
