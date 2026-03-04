import { callGemini } from './gemini';

const SUMMARY_PROMPT = `You are a concise chat summarizer for Weiblocks (a blockchain & AI agency). Given a chat transcript, produce a 2-4 sentence summary covering:
1. What the user was interested in (service type, project idea)
2. Key requirements mentioned (budget, timeline, tech stack)
3. Lead quality (hot/warm/cold based on specificity of inquiry)
Do NOT include greetings or filler. Be factual and brief.`;

export async function generateChatSummary(
  messages: { role: string; content: string }[]
): Promise<string> {
  if (!messages || messages.length < 2) return 'Minimal conversation — no meaningful exchange.';

  const transcript = messages
    .map((m) => `[${m.role === 'user' ? 'User' : 'Bot'}] ${m.content}`)
    .join('\n');

  try {
    const summary = await callGemini(SUMMARY_PROMPT, [], transcript);
    return summary.trim();
  } catch (err) {
    console.error('Summary generation error:', err);
    // Fallback: build a basic summary from user messages
    const userMsgs = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' | ');
    return `User messages: ${userMsgs.slice(0, 300)}`;
  }
}
