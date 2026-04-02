"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sends notifications to a user:
 * 1. In-app banner — flag set via `internal.users.setUserReminder`; UI in `components/ReminderBanner.tsx`
 * 2. Email notification via Resend (implemented below).
 * Note: Web push (browser notifications) is binned — see binned_functions.md
 */
export const sendReminderNotifications = internalAction({
  args: {
    userId: v.id("users"),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    runLabel: v.string(), // "morning" or "evening"
  },
  handler: async (ctx, args) => {
    const { userId, userName, userEmail, runLabel } = args;
    const results = {
      userId,
      email: { sent: false, error: null as string | null },
    };

    // Email notification via Resend.
    if (userEmail) {
      try {
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
          results.email.error = "RESEND_API_KEY not configured";
        } else {
          const { Resend } = await import("resend");
          const resend = new Resend(resendApiKey);

          const displayName = userName || "there";
          const subject =
            runLabel === "morning"
              ? "☀️ Time for your morning journal entry"
              : "🌙 Evening reflection time";
          const htmlContent =
            runLabel === "morning"
              ? `<h2>Good morning, ${displayName}!</h2>
                 <p>Start your day by journaling about how you're feeling. Taking a few minutes to reflect can set a positive tone for the day ahead.</p>
                <p><a href="${process.env.APP_URL || "https://journal.local"}/journal" style="background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Write Journal Entry</a></p>`
              : `<h2>Good evening, ${displayName}!</h2>
                 <p>Reflect on your day and capture your thoughts. Evening journaling can help you process your experiences and prepare for tomorrow.</p>
                <p><a href="${process.env.APP_URL || "https://journal.local"}/journal" style="background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Write Journal Entry</a></p>`;

          const response = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "noreply@journal-app.com",
            to: userEmail,
            subject,
            html: htmlContent,
          });

          if (response.error) {
            results.email.error = response.error.message;
          } else {
            results.email.sent = true;
          }
        }
      } catch (error) {
        results.email.error =
          error instanceof Error ? error.message : "Unknown email error";
      }
    }

    return results;
  },
});
