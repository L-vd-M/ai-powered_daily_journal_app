# AI-Powered Daily Journal App

A full-stack daily journaling application with AI-powered mood analysis, personalised reminders, ambient background music, and email notification support. Built with Next.js, Convex, and Clerk.

---

## Table of Contents

1. [Pulling the Repository](#1-pulling-the-repository)
2. [Local Setup Requirements](#2-local-setup-requirements)
3. [Services Used](#3-services-used)
4. [Environment Variables](#4-environment-variables)
5. [How Branches Work](#5-how-branches-work)
6. [Application Flow](#6-application-flow)
7. [Cron Jobs](#7-cron-jobs)
8. [Running the Application Locally](#8-running-the-application-locally)
9. [Deploying to Vercel](#9-deploying-to-vercel)
10. [TODOs & Dev Challenge Status](#10-todos--dev-challenge-status)

---

## 1. Pulling the Repository

```bash
git clone https://github.com/L-vd-M/ai-powered_daily_journal_app.git
cd ai-powered_daily_journal_app
```

Install dependencies:

```bash
npm install
```

---

## 2. Local Setup Requirements

The following tools must be installed on your machine before you can run this project.

### Node.js

Required version: **Node.js 18 or later**

Download from: https://nodejs.org/

Verify installation:
```bash
node -v
npm -v
```

### Git

Required to clone the repo and manage branches.

Download from: https://git-scm.com/

Verify installation:
```bash
git --version
```

### Convex CLI

Used to sync the backend schema, run migrations, and deploy backend functions.

Installed automatically via `npm install` as part of this project's devDependencies. To use the CLI globally:

```bash
npm install -g convex
```

### Accounts You Need

| Service | Purpose | Sign Up |
|---|---|---|
| [Convex](https://convex.dev) | Backend database, functions, cron jobs | Free tier available |
| [Clerk](https://clerk.com) | Authentication (sign up / sign in) | Free tier available |
| [OpenAI](https://platform.openai.com) | AI mood analysis of journal entries | Pay-per-use API |
| [Resend](https://resend.com) | Email reminder notifications | Free tier available |
| [Vercel](https://vercel.com) | Production deployment | Free tier available |

---

## 3. Services Used

### Next.js 16 (App Router)
Frontend framework. Handles routing, server components, and the overall page structure.

### Convex
Real-time backend-as-a-service. Stores all data (users, journal entries), runs scheduled cron jobs (daily reminders), and exposes queries/mutations/actions to the frontend.

### Clerk
Handles all authentication — sign up, sign in, session management, and JWT verification. Integrated with Convex via `auth.config.ts`.

### OpenAI
Used in `convex/ai.ts` to analyse journal entry content and return a mood label, mood score (−100 to 100), and a short insight string.

### Resend
Email delivery service used to send daily journal reminder emails. Called from `convex/notifications.ts` when the reminder cron job fires.

### Tailwind CSS v4
Utility-first CSS framework for all styling.

### shadcn/ui + Radix UI
Component primitives (Button, form elements). Installed via `npx shadcn@latest add`.

### YouTube IFrame API
Ambient background music player on the homepage. Embeds a playlist via `components/YoutubeAmbientPlayer.tsx`. No API key required.

---

## 4. Environment Variables

This project uses two separate sets of environment variables:

### Next.js (`.env.local` in the project root)

Create a file named `.env.local` in the project root:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://<your-convex-deployment>.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Convex Backend (set via CLI)

These are stored in Convex, not in `.env.local`. Set them with:

```bash
# Development
npx convex env set OPENAI_API_KEY "sk-..."
npx convex env set RESEND_API_KEY "re_..."
npx convex env set RESEND_FROM_EMAIL "noreply@yourdomain.com"
npx convex env set APP_URL "http://localhost:3000"

# Production (add --prod flag)
npx convex env set OPENAI_API_KEY "sk-..." --prod
npx convex env set RESEND_API_KEY "re_..." --prod
npx convex env set RESEND_FROM_EMAIL "noreply@yourdomain.com" --prod
npx convex env set APP_URL "https://your-vercel-app.vercel.app" --prod
```

To list currently set Convex env vars:

```bash
npx convex env list          # development
npx convex env list --prod   # production
```

---

## 5. How Branches Work

This repository uses a two-branch strategy:

### `main`
- **Purpose:** Production-ready code only.
- **Deployed to:** Vercel (automatic deploy on push).
- **Rule:** Only merge into `main` when a feature is fully tested and stable.

### `dev`
- **Purpose:** Active development branch. All new features and experiments are built here.
- **Deployed to:** Not automatically deployed. Test locally or via Convex dev.
- **Rule:** Work here first. Merge into `main` via a pull request only when ready for production.

### Workflow

```
dev  -->  (test locally)  -->  pull request  -->  main  -->  Vercel production
```

```bash
# Switch to dev before making changes
git checkout dev

# After changes are tested, switch to main and merge
git checkout main
git merge --no-ff dev
git push origin main
```

### Branch Naming for Future Features

For isolated features, branch off `dev`:

```bash
git checkout dev
git checkout -b feature/your-feature-name
```

Merge back into `dev` when done, then promote `dev` to `main` when stable.

---

## 6. Application Flow

This section describes the end-to-end journey a user takes through the application and how the different layers (frontend, Convex backend, external services) interact.

### Step 1 — Sign Up / Sign In

All routes under `/dashboard` are protected by Clerk middleware (`middleware.ts`). An unauthenticated visitor is always redirected to `/sign-in`. After authentication, Clerk issues a JWT that Convex validates on every request.

### Step 2 — User Sync and Onboarding

On first sign-in (or any login where profile data is missing), `UserSync.tsx` fires a Convex mutation to upsert the user document into the `users` table. The `ProfileGuard.tsx` component then checks whether required fields (name, email, timezone, country) are populated. If any are missing, the user is redirected to `/onboarding` to confirm or fill in the details before they can access the rest of the app. This information is used by the reminder system to address the user correctly and send notifications.

### Step 3 — Home Dashboard

After onboarding the user lands on `/home`, which shows:
- A personalised greeting (`Welcome back <name>!` if the name is in the database, otherwise `Welcome back!`).
- An ambient YouTube music player that autoloops a calm playlist in the background.
- A call-to-action button to write a new journal entry.

### Step 4 — Writing a Journal Entry

Navigating to `/journal` opens the entry editor. When the user clicks **Post**:
1. A `createJournalEntry` Convex mutation saves the entry (title, content, timestamp) to the `journalEntries` table.
2. An `analyseMoodForEntry` Convex action calls the OpenAI API with the entry text and writes back a mood label (e.g. *Calm*, *Anxious*), a mood score (−100 to 100), and a short insight string to the same document.
3. A `clearPendingReminder` mutation removes the reminder flag from the user's document so no further reminders are sent for that cron window.

**Post rate limit:** After a successful submission the **Post to Journal** button is disabled for **2 minutes**. The button label shows a live countdown (`Please wait 118s...`) and a smaller line below displays the remaining time as minutes and seconds. This prevents users from spamming the OpenAI API and the Convex backend in rapid succession. The cooldown is enforced client-side in `app/(dashboard)/journal/page.tsx` using a `cooldownUntil` timestamp stored in `useState` with a `useEffect` interval tick.

### Step 5 — Viewing Past Entries

The `/journal_view` page fetches all of the authenticated user's journal entries via `listUserStoredEntries` and renders them in a two-column table: **Date** (formatted locale date) and **Entry** (entry title + full content).

### Step 6 — Mood Insights

The `/mood` page fetches the same entry list and filters it by a user-selected time frame (last 24 hours, 7 days, or 30 days). It displays:
- A Recharts line chart plotting mood score over time.
- The average mood score for the selected period.
- A table of individual entries with their mood label and AI insight.

### Step 7 — Reminder Notifications

If a user has not written a journal entry within 10 minutes of a scheduled cron sweep, the Convex backend:
1. Sets a `pendingReminder` flag on the user document (triggers an in-app notification banner).
2. Sends a reminder email via Resend.

See the [Cron Jobs](#7-cron-jobs) section below for the schedule details.

### Flow Diagram

```
[User] → Sign In (Clerk)
           ↓
      UserSync → upsert user doc (Convex)
           ↓
      ProfileGuard → missing fields? → /onboarding → save profile
           ↓
       /home dashboard
           ↓                              ↑
       /journal ─── createJournalEntry ──→ journals table (Convex)
                 ─── analyseMoodForEntry ─→ OpenAI → mood fields written back
                 ─── clearPendingReminder → user doc updated
           ↓
       /journal_view  (read all entries)
       /mood          (filtered chart + table)
           ↓
   [Cron: 08:00 / 16:00 UTC]
      runReminderSweep → skip if recent entry within 10 min
                       → setUserReminder (in-app flag)
                       → sendReminderNotifications → Resend email
```

---

## 7. Cron Jobs

All scheduled jobs are defined in `convex/crons.ts` and run on Convex's infrastructure — no external scheduler is needed. All times are UTC (Convex does not support per-timezone scheduling natively). The target timezone is **SAST (UTC+2)**.

### Active Cron Jobs

#### `journal-reminder-morning`

| Property | Value |
|---|---|
| Schedule | Daily at **08:00 UTC** (10:00 SAST) |
| Handler | `internal.reminders.runReminderSweep` |
| Run label | `morning` |

Fires a morning reminder sweep. For each registered user it checks whether a journal entry was created in the 10 minutes before the cron triggered. Users who have not written recently receive an in-app notification flag and a reminder email.

#### `journal-reminder-evening`

| Property | Value |
|---|---|
| Schedule | Daily at **16:00 UTC** (18:00 SAST) |
| Handler | `internal.reminders.runReminderSweep` |
| Run label | `evening` |

Identical logic to the morning sweep but fires in the evening to give users a second opportunity to journal before the end of the day.

---

### Testing Cron Job (Disabled in Production)

#### `journal-reminder-test-every-5-minutes` *(commented out)*

| Property | Value |
|---|---|
| Schedule | Every **5 minutes** (interval) |
| Handler | `internal.reminders.runReminderSweep` |
| Run label | `test` |

This cron is defined but commented out in `convex/crons.ts`. It is intended for local development and testing only. **Do not uncomment this in production** — it will spam all users with notifications every 5 minutes.

To enable it for testing:

```ts
// convex/crons.ts
crons.interval(
  "journal-reminder-test-every-5-minutes",
  { minutes: 5 },
  internal.reminders.runReminderSweep,
  { runLabel: "test" }
);
```

Remember to comment it out again and redeploy before merging to `main`.

---

### How the Reminder Sweep Works

All three cron jobs call the same `internal.reminders.runReminderSweep` action:

1. Fetches all registered users from the `users` table.
2. For each user, queries whether a journal entry exists within the last 10 minutes.
3. **If a recent entry exists** → skip (user has already journaled; no notification needed).
4. **If no recent entry** →
   - Sets `pendingReminder: true` on the user document (shows an in-app banner).
   - Calls `internal.notifications.sendReminderNotifications` which sends a Resend email.

When the user subsequently writes an entry, `clearPendingReminder` removes the flag and dismisses the banner.

---

## 8. Running the Application Locally

You need **two terminals** running simultaneously — one for Convex and one for Next.js.

### Step 1 — Log in to Convex

First time only:

```bash
npx convex dev
```

This will open a browser to authenticate, create a dev deployment, and start syncing your backend. Leave this terminal running.

### Step 2 — Start the Next.js dev server

In a second terminal:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome or Firefox.

> **Note:** Do not use VS Code's built-in Simple Browser to test the app. YouTube iframe embeds and some Clerk flows do not work correctly in VS Code's Electron webview. Always test in a real browser.

### Step 3 — Verify it is working

- Navigate to `http://localhost:3000` — you should be redirected to the sign-in page.
- Sign up for an account.
- Complete the onboarding form (name, email, country, timezone).
- You should land on the home dashboard with the ambient music player and welcome greeting.

### Useful dev commands

```bash
# View Convex backend logs (dev)
npx convex logs

# View Convex backend logs (production)
npx convex logs --prod

# List Convex environment variables
npx convex env list

# Open Convex dashboard in browser
npx convex dashboard
```

---

## 9. Deploying to Vercel

### Prerequisites

Before deploying, ensure:
- [ ] All production Convex env vars are set (`npx convex env list --prod`)
- [ ] Your Resend domain (`RESEND_FROM_EMAIL`) is verified at https://resend.com
- [ ] `main` branch has all the changes you want live

### First-time Vercel Setup

1. Go to https://vercel.com and log in.
2. Click **Add New Project** and import your GitHub repository.
3. Set the **Framework Preset** to `Next.js`.
4. Override the **Build Command** with:

```
sh -c 'if [ -n "$CONVEX_DEPLOY_KEY" ]; then npx convex deploy --yes; fi' && next build
```

> This command conditionally deploys the Convex backend only when `CONVEX_DEPLOY_KEY` is present. This means:
> - **Production builds** (`main` branch): Convex is deployed + Next.js is built.
> - **Preview builds** (`dev` and other branches): `CONVEX_DEPLOY_KEY` is absent so Convex deploy is skipped, only Next.js is built.
>
> Without the conditional, Vercel preview builds (e.g. the `dev` branch) will fail because `CONVEX_DEPLOY_KEY` is not available in that environment.

5. Add the following **Environment Variables** in the Vercel dashboard:

| Variable | Environment | Value |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | All | Your Convex production deployment URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | All | From Clerk dashboard |
| `CLERK_SECRET_KEY` | All | From Clerk dashboard |
| `CONVEX_DEPLOY_KEY` | **Production only** | From Convex dashboard → Settings → Deploy Key |

> ⚠️ Set `CONVEX_DEPLOY_KEY` for **Production only**, not Preview or Development. This is what controls whether the conditional Convex deploy step runs.

6. Click **Deploy**.

### Subsequent Deploys

Vercel auto-deploys whenever you push to `main`. Because the build command conditionally runs `npx convex deploy --yes` when `CONVEX_DEPLOY_KEY` is present, **both** the Convex backend and the Next.js frontend are updated in a single push to `main`:

```bash
git checkout main
git merge --no-ff dev
git push origin main
```

> Vercel detects this as a Production build, `CONVEX_DEPLOY_KEY` is present, so `npx convex deploy --yes` runs first, then Next.js builds. Preview builds from `dev` or other branches skip the Convex deploy step automatically.

### Post-Deploy Checklist

- [ ] Visit your Vercel URL and sign in
- [ ] Check `npx convex logs --prod` for any runtime errors
- [ ] Verify email reminders are sending via the Resend dashboard
- [ ] Test the onboarding flow with a new account

### Vercel Project URL

```
https://ai-powered-daily-journal-app-five.vercel.app
```

---

## 10. TODOs & Dev Challenge Status

### Known Bugs & Pending Work

- [ ] **Settings page** — Users currently have no way to edit their profile details (name, email, timezone, country) after onboarding. A dedicated settings tab needs to be added to the dashboard.
- [ ] **Clerk sign-up data not auto-populated** — When a user signs up via Clerk, their name and email address are not automatically passed through to the app. Users are currently redirected to the onboarding page to enter these manually. This should be resolved by reading the Clerk user object on the backend (`identity.name`, `identity.email`) during the `upsertUser` call and using those values as defaults.

---

### Dev Challenge Requirements

#### Core Features

| Status | Feature | Notes |
|---|---|---|
| ✅ | Write a daily journal entry | Create entry with title + content on `/journal` |
| ❌ | Edit journal entries | Not yet implemented — entries are read-only after posting. Did however implement database edits in the users table to update user information |
| ❌ | Delete journal entries | Not yet implemented |
| ✅ | AI-generated mood detection & reflection | OpenAI returns `moodScore` (−100 to 100), `moodLabel`, and `moodInsight` per entry |
| ✅ | Daily cron reminder to prompt journaling | Two cron jobs: 10:00 SAST (morning) and 18:00 SAST (evening) |
| ✅ | Email notifications via cron | Resend sends reminder emails to the user's stored email address |
| ❌ | Push notifications | Binned for now — see `binned_functions.md` for full reinstatement guide |

#### Tech Stack Requirements

| Status | Requirement | Notes |
|---|---|---|
| ✅ | Next.js (App Router) + TailwindCSS + Shadcn | Fully implemented |
| ✅ | Convex — Database, Functions, Cron Jobs | Schema, queries, mutations, internal actions, crons all in place |
| ✅ | OpenAI API integration | Mood classification via `gpt-4o-mini` |
| ✅ | Vercel deployment with environment variables | Auto-deploys from `main`; build command includes `npx convex deploy --yes` |
| ✅ | GitHub repo with clear commits and README | This repo |
| ❌ | QA tests (unit or e2e) | No tests written yet. Still want to look at it. |

#### Deliverables

| Status | Deliverable |
|---|---|
| ✅ | GitHub repository with commits and README |
| ✅ | Live Vercel app |
| ✅ | Loom / video walkthrough |

#### Stretch Goals

| Status | Goal |
|---|---|
| ✅ | Sentiment / mood graph over time (1 day / 7 days / 30 days) |
| ❌ | Search through journal entries |
| ❌ | Markdown support in the journal editor |
| ❌ | Tamagotchi-style mood pet |

#### Loom Video Links

| Video Number | Video Title | Video Link |
|---|---|---|
| 1 | Exploring the New Account Setup and Features of Our Application 🌟 | https://www.loom.com/share/bfd7bfa7f78c425a88d16fce3c124dd9 |
| 2 | AI Powered Daily Journal App - Loom Video 2 - Signing and Application flow explenation | https://www.loom.com/share/f462bd44bc00463eaed74bc2aa57f160 |
| 3 | AI Powered Daily Journal App - Loom Video 3 - Cron Jobs Explanation and Demonstration | https://www.loom.com/share/a1e64fff4b6c4096b8b905102ef37b3a |
| 4 | AI Powered Daily Journal App - Loom Video 4 - Finalising Cron Job Showcasing | https://www.loom.com/share/0be36b336e9945b283f37b8e92545d14 |
| 5 | AI Powered Daily Journal App - Loom Video 5 - Final greetings | https://www.loom.com/share/d795c878a29a444f98bb0367d2a8372a |

---

## Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router) | 16.2.1 |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS | v4 |
| Components | shadcn/ui + Radix UI | latest |
| Auth | Clerk | ^7.0.7 |
| Backend | Convex | ^1.34.1 |
| AI | OpenAI | ^6.33.0 |
| Email | Resend | ^6.10.0 |
| Charts | Recharts | ^3.8.1 |
| Deployment | Vercel | — |
