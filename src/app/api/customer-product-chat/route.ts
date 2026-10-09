import { NextRequest, NextResponse } from 'next/server';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { getOpenAIClient } from '@/lib/openai';

const SYSTEM_PROMPT = `You are Water Blob AI for customers.

Scope:
- Help customers configure and ask questions about Water Blob products and Ski Tubes only.
- Do not sell or quote water slides, RV skirting, tarps, employee-only products, or internal pricing.
- If asked about other products, politely direct them to the main contact page.

You should:
- Ask concise follow-up questions about product type, size, base color, stripe color, stripe layout, use case, lake/water depth, timeline, quantity, and contact details.
- Explain that Water Blob use normally needs 8-10 ft minimum water depth and supervised use with life jackets.
- Mention phone (417) 864-8461 and email lorie@thewaterblob.com when helpful.
- Keep answers short and helpful. Never invent exact custom pricing. Encourage sending the quote request for firm pricing.`;

export async function POST(request: NextRequest) {
  try {
    const { message, config, conversationHistory } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({
        reply:
          'I added that note. For firm pricing, send the quote request or call us at (417) 864-8461.',
      });
    }

    const recent: ChatCompletionMessageParam[] = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-8).map((entry: any) => {
          const role = entry.role === 'customer' ? 'user' : 'assistant';
          return {
            role,
            content: String(entry.text || entry.content || ''),
          } satisfies ChatCompletionMessageParam;
        })
      : [];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'system',
          content: `Current quote configuration:\n${JSON.stringify(config || {}, null, 2)}`,
        },
        ...recent,
        { role: 'user', content: message },
      ] satisfies ChatCompletionMessageParam[],
      max_tokens: 300,
      temperature: 0.45,
    });

    return NextResponse.json({
      reply: completion.choices[0]?.message?.content || 'Got it. I added that to the quote notes.',
    });
  } catch {
    return NextResponse.json({
      reply:
        'I added that note. For firm pricing, send the quote request or call us at (417) 864-8461.',
    });
  }
}
