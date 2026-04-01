# Multi-Channel Notification System Setup Guide

This guide explains how to set up the complete notification system with in-app banners, web push notifications, and email delivery.

## Architecture Overview

Reminders are delivered through three channels:

1. **In-App Banner** - Static flag that displays when user visits the dashboard
2. **Web Push Notifications** - Browser notifications sent via Web Push API
3. **Email** - EmailSent via Resend email service

All three are triggered by cron jobs running daily at:
- **Morning**: 08:00 UTC (10:00 SAST)
- **Evening**: 16:00 UTC (18:00 SAST)

## Environment Variables Required

### 1. Web Push (VAPID Keys)

Web push notifications require VAPID (Voluntary Application Server Identification) keys.

#### Generate VAPID Keys

Run this command to generate a new pair:

```bash
npx web-push generate-vapid-keys
```

You'll get output like:
```
Public Key: <long base64 string>
Private Key: <long base64 string>
```

#### Configure in `.env.local` and Convex

**Frontend (`.env.local`):**
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-public-key>
```

**Convex backend (via Convex dashboard or `npx convex env set`):**
```bash
npx convex env set VAPID_PUBLIC_KEY <your-public-key>
npx convex env set VAPID_PRIVATE_KEY <your-private-key>
```

### 2. Email (Resend)

Email notifications are sent via Resend. Set up a free account at https://resend.com

#### Get Your Resend API Key

1. Sign up at https://resend.com
2. Navigate to API Keys section
3. Create a new API key

#### Configure in Convex

```bash
npx convex env set RESEND_API_KEY <your-resend-api-key>
npx convex env set RESEND_FROM_EMAIL <your-sender-email>
npx convex env set APP_URL https://your-app-url.com  # For email links
```

**Note:** For development, use `https://journal.local` or `http://localhost:3000`

## Frontend Implementation

### 1. Service Worker Registration

The service worker (`/public/service-worker.js`) handles incoming push notifications. It's automatically registered by the `usePushNotifications` hook.

### 2. Push Notification Permission

When users first visit the dashboard, they'll see a prompt to enable notifications. This uses the browser's Notification API.

**User Flow:**
1. "Get Reminder Notifications" prompt appears
2. User clicks "Enable" → browser asks for permission
3. If granted, push subscription is saved to database
4. If declined, they can always enable it later in browser settings

### 3. Reminder Banner

The `<ReminderBanner>` component displays when `pendingReminder = true` and the user is on the dashboard.

**Dismissal:**
- Clicking "Dismiss" clears the flag
- Creating a journal entry automatically clears the flag

## Database Schema

The `users` table includes notification fields:

```typescript
{
  // ... other fields
  pendingReminder?: boolean,              // In-app banner flag
  lastReminderAt?: number,               // Timestamp of last reminder
  lastReminderRunLabel?: string,         // "morning" or "evening"
  pushSubscription?: {                   // Browser push subscription
    endpoint: string,
    keys: {
      auth: string,
      p256dh: string
    }
  }
}
```

## Cron Job Flow

### Morning Reminder (10:00 SAST / 08:00 UTC)

```
1. runReminderSweep action triggers
2. For each user:
   a. Check if they've journaled in last 10 minutes
   b. If not, set pendingReminder = true
   c. Send web push notification (if subscribed)
   d. Send email (if address on file)
3. User sees banner on next dashboard visit
```

### User Actions

- **Sees banner** → Sets `pendingReminder = false` explicitly or
- **Creates entry** → `clearPendingReminder` mutation called automatically
- **Navigates away/back** → Banner shows again if user didn't journal

## Testing

### Test Cron Locally

A test cron runs every 5 minutes in development:

```typescript
// convex/crons.ts
crons.interval("journal-reminder-test-every-5-minutes", {minutes: 5}, ...)
```

Check Convex logs to verify notifications are being sent:

```bash
npx convex logs --follow
```

### Manual Push Subscription Test

1. Enable browser notifications when prompted
2. Check browser DevTools → Application → ServiceWorkers to confirm registration
3. Manually test with Convex functions dashboard

### Test Email

Set `RESEND_API_KEY` and create a journal entry to trigger the flow:
- Cron will run (or wait for scheduled time)
- Check email inbox for notification
- Check browser for push notification

## Troubleshooting

### "VAPID keys not configured"

- Run `npx convex env set VAPID_PUBLIC_KEY <key>`
- Run `npx convex env set VAPID_PRIVATE_KEY <key>`
- Redeploy: `npx convex deploy`

### Service worker not registering

- Check browser DevTools for errors
- Verify `/public/service-worker.js` exists
- Clear browser cache and reload

### Email not sending

- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for sending limits
- Verify `RESEND_FROM_EMAIL` matches the email configured in Resend

### Browser notifications permission denied

- In Chrome: Settings → Privacy and security → Site settings → Notifications
- Find the app URL and change to "Allow"
- Reload the page and try opting in again

## Production Deployment

Before deploying to production:

1. **Comment out test cron** in `convex/crons.ts`
2. **Verify environment variables** are set in production Convex project:
   ```bash
   npx convex env list  # Should show all keys
   ```
3. **Test with staging URL** first
4. **Update APP_URL** to production domain
5. **Deploy:** `npx convex deploy`

## Files Modified

### Backend
- `convex/schema.ts` - Added `pushSubscription` field
- `convex/users.ts` - Added push subscription mutations
- `convex/reminders.ts` - Changed to internal action to call notifications
- `convex/notifications.ts` - New file for web push and email sending
- `convex/crons.ts` - Already configured, just ensure test cron is commented out

### Frontend
- `app/(dashboard)/DashboardClient.tsx` - Shows banner and subscription prompt
- `app/(dashboard)/layout.tsx` - Wraps with DashboardClient
- `app/(dashboard)/journal/page.tsx` - Calls `clearPendingReminder` on entry creation
- `components/ReminderBanner.tsx` - The reminder banner component
- `lib/usePushNotifications.ts` - Hook for subscription management
- `public/service-worker.js` - Handles incoming push notifications

## Next Steps

1. Generate VAPID keys: `npx web-push generate-vapid-keys`
2. Sign up for Resend: https://resend.com
3. Set environment variables
4. Test locally with the 5-minute cron
5. Deploy to production

