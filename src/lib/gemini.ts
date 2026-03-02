import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function callGemini(
  systemPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  message: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
  });

  // Convert history to Gemini format (user/model roles)
  // Gemini requires: history must start with 'user' and alternate user/model
  const rawHistory = history.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Drop leading non-user turns and ensure strict alternation
  const geminiHistory: { role: string; parts: { text: string }[] }[] = [];
  let lastRole = '';
  for (const turn of rawHistory) {
    if (geminiHistory.length === 0 && turn.role !== 'user') continue; // must start with user
    if (turn.role === lastRole) continue; // skip duplicate consecutive roles
    geminiHistory.push(turn);
    lastRole = turn.role;
  }
  // History must end with 'model' (Gemini rule: last history turn before sendMessage must be model)
  if (geminiHistory.length > 0 && geminiHistory[geminiHistory.length - 1].role === 'user') {
    geminiHistory.pop();
  }

  const chat = model.startChat({
    history: geminiHistory,
    generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
  });

  const result = await chat.sendMessage(message);
  return result.response.text();
}
