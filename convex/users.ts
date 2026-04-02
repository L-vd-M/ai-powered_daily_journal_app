import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Called client-side after login to create or refresh the user's DB record.
// Uses tokenIdentifier as the stable key — never accepts userId as an argument.
export const upsertUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Temporary: log FULL identity object to diagnose missing email address and name of the user 
    // (Debugging only)
    // console.log("[upsertUser] full identity:", JSON.stringify(identity));

    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    const now = Date.now();

    // Existing record found, update it. (Login flow.)
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: identity.name ?? existing.name,
        email: identity.email ?? existing.email,
        imageUrl: identity.pictureUrl ?? existing.imageUrl,
        lastLogin: now,
      });
      return existing._id;
    }

    // No existing record, create a new one. (Signup flow.)
    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name,
      email: identity.email,
      imageUrl: identity.pictureUrl,
      createdAt: now,
      lastLogin: now,
    });
  },
});

// Returns the current user's name
export const getUserName = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    return user?.name ?? null;
  },
});

// Returns the current user's document, or null if not authenticated / not yet created.
export const getUserDocuments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
  },
});

// Subscribe user to push notifications by storing their PushSubscription.
export const subscribeToPush = mutation({
  args: {
    subscription: v.object({
      endpoint: v.string(),
      keys: v.object({
        auth: v.string(),
        p256dh: v.string(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      pushSubscription: args.subscription,
    });

    return { success: true };
  },
});

// Unsubscribe user from push notifications.
export const unsubscribeFromPush = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      pushSubscription: undefined,
    });

    return { success: true };
  },
});

// Update the user's profile fields (called from the onboarding page that comes after sign-up).
export const updateUserProfile = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    timezone: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      name: args.name,
      email: args.email,
      timezone: args.timezone,
      country: args.country,
    });

    return { success: true };
  },
});

// Clear the pending reminder flag (called when user dismisses banner or writes entry).
export const clearPendingReminder = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      pendingReminder: false,
    });

    return { success: true };
  },
});

// Internal: Get all users (for cron reminder sweep)
export const getAllUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Internal: Set reminder flag for a user
export const setUserReminder = internalMutation({
  args: {
    userId: v.id("users"),
    now: v.number(),
    runLabel: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      pendingReminder: true,
      lastReminderAt: args.now,
      lastReminderRunLabel: args.runLabel,
    });
  },
});
