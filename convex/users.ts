import { mutation, query } from "./_generated/server";

// Called client-side after login to create or refresh the user's DB record.
// Uses tokenIdentifier as the stable key — never accepts userId as an argument.
export const upsertUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Temporary: log FULL identity object to diagnose missing claims 
    // (Debugging only - do not log personally identifiable information in production!)
    console.log("[upsertUser] full identity:", JSON.stringify(identity));

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
