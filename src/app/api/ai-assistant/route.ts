import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getOpenAIClient } from '@/lib/openai';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 503 });
    }

    const { query, conversationHistory } = await request.json();
    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const systemPrompt = `You are an AI assistant for Water Blob\u00ae employee portal. You can help with work order queries, customer lookups, and order management. When asked about work orders, query the database and provide helpful summaries.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user' as const, content: query },
    ];

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1000,
    });

    const reply = completion.choices[0]?.message?.content || 'No response generated.';

    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get AI response' }, { status: 500 });
  }
}
