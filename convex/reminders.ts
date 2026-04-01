import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Runs from cron (morning/evening/test).
// User filtering logic:
// - Skip users with no email.
// - Skip users who posted within 10 minutes of this cron run.
// - Flag remaining users with pendingReminder=true.
export const runReminderSweep = internalMutation({
  args: {
    runLabel: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;     // 10 minutes in milliseconds

    const users = await ctx.db.query("users").collect();

    for (const user of users) {
      // Basic recipient filtering: only users with an email can receive reminders.
      if (!user.email) continue;

      const recentEntry = await ctx.db
        .query("journalEntries")
        .withIndex("by_userId_and_createdAt", (q) =>
          q.eq("userId", user._id).gte("createdAt", tenMinutesAgo)
        )
        .first();

      // If user wrote near this cron trigger, ignore reminder for this run (within 10 minutes with current setup).
      if (recentEntry) continue;

      await ctx.db.patch(user._id, {
        pendingReminder: true,
        lastReminderAt: now,
        lastReminderRunLabel: args.runLabel,
      });
    }
  },
});
