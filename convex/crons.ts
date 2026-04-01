// Convex crons for scheduling daily journal reminder sweeps.
// Production requirement:
// - 10:00 local (SAST) reminder
// - 18:00 local (SAST) reminder
// Convex schedules are UTC-based, so SAST(UTC+2) maps to:
// - 08:00 UTC
// - 16:00 UTC

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Morning reminder sweep (10:00 SAST / 08:00 UTC)
crons.daily(
  "journal-reminder-morning",
  { hourUTC: 8, minuteUTC: 0 },
  internal.reminders.runReminderSweep,
  { runLabel: "morning" }
);

// Evening reminder sweep (18:00 SAST / 16:00 UTC)
crons.daily(
  "journal-reminder-evening",
  { hourUTC: 16, minuteUTC: 0 },
  internal.reminders.runReminderSweep,
  { runLabel: "evening" }
);

// TESTING ONLY: uncomment this block to run reminder sweeps every 5 minutes.
// Keep this disabled in production to avoid excessive reminder processing.
// crons.interval(
//   "journal-reminder-test-every-5-minutes",
//   { minutes: 5 },
//   internal.reminders.runReminderSweep,
//   { runLabel: "test" }
// );

export default crons;
