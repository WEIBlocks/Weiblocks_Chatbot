import { NextRequest, NextResponse } from 'next/server';
import { openai, WEIBLOCKS_SYSTEM_PROMPT } from '@/lib/openai';
import { callGemini } from '@/lib/gemini';
import { connectDB } from '@/lib/mongodb';
import { detectIntent } from '@/lib/intentDetector';
import Conversation from '@/models/Conversation';

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

// Detect email addresses in text
const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
function extractEmail(text: string): string | null {
  const match = text.match(EMAIL_RE);
  return match ? match[0].toLowerCase() : null;
}

// AI_PROVIDER env: 'gemini' (default) | 'openai'
const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  let intent = { isLead: false, projectType: 'General', confidence: 0 };

  try {
    const { message, sessionId, history = [], hasEmail = false, messageCount = 0 } = await req.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'message and sessionId are required' },
        { status: 400 }
      );
    }

    // Detect lead intent from current message (before AI call)
    intent = detectIntent(message);

    const cleanHistory = history
      .slice(-10)
      .map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Build dynamic system prompt — ask for email after first message if no lead intent
    let systemPrompt = WEIBLOCKS_SYSTEM_PROMPT;
    const shouldAskEmail = !hasEmail && !intent.isLead && messageCount === 1;
    if (shouldAskEmail) {
      // First message, no high intent — ask for email naturally at the end of the reply
      systemPrompt += `\n\n## IMPORTANT — EMAIL COLLECTION
This is the user's FIRST message and they haven't shared their email yet. After answering their question, end your reply by naturally asking for their email. Keep it brief and conversational — e.g.:
- "By the way, what's the best email to reach you? I'd love to have our team follow up."
- "What email should I use to send you more details?"
Just one short sentence at the end. Do NOT be pushy.`;
    } else if (!hasEmail && messageCount >= 3) {
      // Still no email after a few exchanges — stop asking
      systemPrompt += `\n\n## NOTE: The user hasn't shared their email. Do NOT ask for it again. Continue helping normally.`;
    }

    let reply = '';

    if (AI_PROVIDER === 'gemini') {
      // ── Gemini 2.5 Flash ──────────────────────────────────────────
      reply = await callGemini(systemPrompt, cleanHistory, message);
    } else {
      // ── OpenAI GPT-4o-mini ────────────────────────────────────────
      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: systemPrompt },
        ...cleanHistory,
        { role: 'user', content: message },
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 600,
        temperature: 0.7,
      });

      reply =
        completion.choices[0]?.message?.content ??
        "I'm sorry, I couldn't generate a response. Please try again.";
    }

    // Detect email in user message
    const detectedEmail = extractEmail(message);

    // Save conversation to MongoDB asynchronously (non-blocking)
    connectDB()
      .then(async () => {
        const updateSet: Record<string, unknown> = {
          intentDetected: intent.isLead,
          projectType: intent.projectType,
        };
        if (detectedEmail) {
          updateSet.detectedEmail = detectedEmail;
        }

        await Conversation.findOneAndUpdate(
          { sessionId },
          {
            $push: {
              messages: [
                { role: 'user', content: message, timestamp: new Date() },
                { role: 'assistant', content: reply, timestamp: new Date() },
              ],
            },
            $set: updateSet,
          },
          { upsert: true, new: true }
        );
      })
      .catch((err) => console.error('DB save error:', err));

    return NextResponse.json(
      { reply, intent, sessionId, detectedEmail, askedForEmail: shouldAskEmail },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    console.error('Chat API error:', error);

    const isQuotaError =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as { status: number }).status === 429;

    if (isQuotaError) {
      return NextResponse.json(
        {
          reply:
            "I'm temporarily unavailable due to API limits. Please contact us directly at hi@weiblocks.io or call **+1 302-366-3496**. We'd love to discuss your project!",
          intent,
          sessionId: null,
        },
        { status: 200, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
