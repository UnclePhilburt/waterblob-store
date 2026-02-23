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

    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const response = await openaiClient.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });

    const arrayBuffer = await response.arrayBuffer();
    const base64string = Buffer.from(arrayBuffer).toString('base64');

    return NextResponse.json({ audio: base64string });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
