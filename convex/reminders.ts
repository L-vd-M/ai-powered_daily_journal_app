import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Runs from cron (morning/evening/test).
// User filtering logic:
// - Skip users who posted within 10 minutes of this cron run.
// - Flag remaining users with pendingReminder=true.
// - Send multimodal notifications: in-app banner, web push, and email.
export const runReminderSweep = internalAction({
  args: {
    runLabel: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;     // 10 minutes in milliseconds

    const users = await ctx.runQuery(internal.users.getAllUsers);

    for (const user of users) {
      const recentEntry = await ctx.runQuery(internal.journals.getUserRecentEntry, {
        userId: user._id,
        since: tenMinutesAgo,
      });

      // If user wrote near this cron trigger, skip reminder for this run (within 10 minutes).
      if (recentEntry) continue;

      // Flag user with pending reminder (in-app banner).
      await ctx.runMutation(internal.users.setUserReminder, {
        userId: user._id,
        now,
        runLabel: args.runLabel,
      });

      // Send email notification.
      await ctx.runAction(internal.notifications.sendReminderNotifications, {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        runLabel: args.runLabel,
      });
    }
  },
});
