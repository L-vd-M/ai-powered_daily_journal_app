"use node";

// This file runs in the Node.js Convex runtime so it can use the OpenAI SDK.
// analyseMoodForEntry — called from the client after a journal entry is created.
// It sends the entry content to OpenAI and patches the journalEntry with the results.

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import OpenAI from "openai";

// ──────────────────────────────────────────────────────────────────────────────
// Public action — called from the client
// ──────────────────────────────────────────────────────────────────────────────

export const analyseMoodForEntry = action({
  args: {
    entryId: v.id("journalEntries"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const openai = new OpenAI();  // reads OPENAI_API_KEY from Convex environment

    {/* OpenAI API call to analyse the mood of the journal entry content.
    The system prompt instructs the model to return a JSON object with three fields:
    - moodLabel: a short description of the dominant emotion
    - moodScore: a number from -100 (very negative) to 100 (very positive)
    - moodInsight: a short empathetic observation about the emotional content 
    Chosen gpt-4o-mini model for analysis due to its balance of performance and cost */}
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an empathetic mood analysis assistant for a personal journal app.
Analyse the emotional tone of the journal entry provided and return a JSON object with exactly these three fields:
- "moodLabel": a single word or short phrase describing the dominant emotion (e.g. "Happy", "Sad", "Anxious", "Calm", "Excited", "Frustrated", "Grateful", "Melancholy", "Hopeful", "Overwhelmed")
- "moodScore": a number from -100 (very negative) to 100 (very positive), reflecting the overall emotional valence
- "moodInsight": a 1-2 sentence empathetic and supportive observation about the emotional content of the entry

Respond ONLY with valid JSON. Do not include any other text.`,
        },
        {
          role: "user",
          content: args.content,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      moodLabel?: string;
      moodScore?: number;
      moodInsight?: string;
    };

    await ctx.runMutation(internal.journals.saveMoodAnalysis, {
      entryId: args.entryId,
      moodLabel: String(parsed.moodLabel ?? "Unknown"),
      moodScore: Math.max(-100, Math.min(100, Number(parsed.moodScore ?? 0))),
      moodInsight: String(parsed.moodInsight ?? ""),
      analysedAt: Date.now(),
    });
  },
});


