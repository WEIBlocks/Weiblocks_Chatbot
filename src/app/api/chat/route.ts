import { NextRequest, NextResponse } from 'next/server';
import { openai, WEIBLOCKS_SYSTEM_PROMPT } from '@/lib/openai';
import { connectDB } from '@/lib/mongodb';
import { detectIntent } from '@/lib/intentDetector';
import Conversation from '@/models/Conversation';

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

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
    const { message, sessionId, history = [] } = await req.json();

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'message and sessionId are required' },
        { status: 400 }
      );
    }

    // Detect lead intent from current message (before OpenAI call)
    intent = detectIntent(message);

    // Build messages for OpenAI
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: WEIBLOCKS_SYSTEM_PROMPT },
      ...history.slice(-10).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    // Call OpenAI GPT-4o-mini
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 600,
      temperature: 0.7,
    });

    const reply =
      completion.choices[0]?.message?.content ??
      "I'm sorry, I couldn't generate a response. Please try again.";

    // Save conversation to MongoDB asynchronously (non-blocking)
    connectDB()
      .then(async () => {
        await Conversation.findOneAndUpdate(
          { sessionId },
          {
            $push: {
              messages: [
                { role: 'user', content: message, timestamp: new Date() },
                { role: 'assistant', content: reply, timestamp: new Date() },
              ],
            },
            $set: {
              intentDetected: intent.isLead,
              projectType: intent.projectType,
            },
          },
          { upsert: true, new: true }
        );
      })
      .catch((err) => console.error('DB save error:', err));

    return NextResponse.json({ reply, intent, sessionId }, { headers: corsHeaders });
  } catch (error: unknown) {
    console.error('Chat API error:', error);

    // Handle OpenAI quota/billing errors gracefully with friendly message + still return intent
    const isQuotaError =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      (error as { status: number }).status === 429;

    if (isQuotaError) {
      return NextResponse.json(
        {
          reply:
            "I'm temporarily unavailable due to API limits. Please contact us directly at [email protected] or call **+1 302-366-3496**. We'd love to discuss your project!",
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
