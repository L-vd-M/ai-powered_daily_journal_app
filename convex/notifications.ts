"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sends multimodal notifications to a user:
 * 1. In-app banner:
 *    - Reminder flag is set in `convex/reminders.ts` via `internal.users.setUserReminder`
 *    - Pending reminder state is stored in `convex/users.ts`
 *    - Banner visibility is decided in `app/(dashboard)/DashboardClient.tsx`
 *    - Banner UI is rendered in `components/ReminderBanner.tsx`
 *    - This file does NOT render the in-app banner UI
 * 2. Web push notification:
 *    - Implemented in this file in the `pushSubscription` block below
 * 3. Email notification:
 *    - Implemented in this file in the `userEmail` / Resend block below
 */
export const sendReminderNotifications = internalAction({
  args: {
    userId: v.id("users"),
    userName: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    pushSubscription: v.optional(
      v.object({
        endpoint: v.string(),
        keys: v.object({
          auth: v.string(),
          p256dh: v.string(),
        }),
      })
    ),
    runLabel: v.string(), // "morning" or "evening"
  },
  handler: async (ctx, args) => {
    const { userId, userName, userEmail, pushSubscription, runLabel } = args;
    const results = {
      userId,
      push: { sent: false, error: null as string | null },
      email: { sent: false, error: null as string | null },
    };

    // 2. Web push notification is implemented in this file.
    if (pushSubscription) {
      try {
        const webPush = await import("web-push");
        const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
        const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

        if (!vapidPublicKey || !vapidPrivateKey) {
          results.push.error = "VAPID keys not configured";
        } else {
          webPush.setVapidDetails(
            "mailto:support@journal-app.local",
            vapidPublicKey,
            vapidPrivateKey
          );

          const title =
            runLabel === "morning"
              ? "☀️ Good morning! Time to journal"
              : "🌙 Evening check-in";
          const body =
            runLabel === "morning"
              ? "Start your day by reflecting on how you're feeling."
              : "Take a moment to capture your thoughts from today.";

          const payload = JSON.stringify({
            title,
            body,
            icon: "/icon-192x192.png", // Add icon to public dir
            badge: "/badge-72x72.png", // Add badge to public dir
            tag: "journal-reminder",
            requireInteraction: false, // Allow auto-close
            actions: [
              {
                action: "open-journal",
                title: "Write Entry",
              },
              {
                action: "close",
                title: "Dismiss",
              },
            ],
          });

          await webPush.sendNotification(pushSubscription, payload);
          results.push.sent = true;
        }
      } catch (error) {
        results.push.error =
          error instanceof Error ? error.message : "Unknown push error";
      }
    }

    // 3. Email notification is implemented in this file via Resend.
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
