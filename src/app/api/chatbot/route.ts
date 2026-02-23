import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getOpenAIClient } from '@/lib/openai';

const KNOWLEDGE_BASE = `
You are a helpful AI assistant for Water Blob®, the original water launcher since 1984. You help customers with questions about products, sizing, safety, setup, and ordering.

## COMPANY INFO:
- Water Blob® is the original water launcher, established in 1984
- Commercial-grade inflatable water toys for summer camps, resorts, and lakes
- Trusted by 500+ camps worldwide
- Featured in Hollywood films: Jackass 3D, Pitch Perfect 2, Piranha 3D, Heavyweights
- 40+ years of experience in water recreation

## CONTACT INFORMATION:
- **Phone**: (417) 864-8461
- **Email**: lorie@thewaterblob.com
- **Address**: 2045 N. National Ave, Springfield, MO
- **Business Hours**: Monday - Friday, 8:00 AM - 4:30 PM CST

When customers ask how to contact us, order, get a quote, or need help, provide this contact information.

## PRODUCTS:
### Water Blob® Sizes:
1. **25ft Water Blob®** - Perfect for smaller venues and private lakes
2. **30ft Water Blob®** - Ideal for summer camps and resorts (best seller)
3. **35ft Water Blob®** - For high-traffic camps and water parks
4. **40ft Water Blob®** - Professional-grade for maximum launch height

### Other Products:
- **Water Slides**: 100ft+ commercial vinyl water slides for camps
- **Ski Tubes**: Premium tow tubes for boats

## SAFETY:
- Only 2 people on the blob at a time (1 sits, 1 jumps)
- Water depth must be 8-10 feet minimum
- Life jackets required for all participants
- Commercial-grade 22oz PVC vinyl construction

## SETUP:
- Setup time: Under 30 minutes
- Requires: Electric air pump, anchor weights, marine-grade rope, life jackets
- Water depth: 8-10 feet minimum in landing zone

## SHIPPING:
- Ships nationwide
- Smaller models (25ft-30ft): Ship via UPS
- Larger models (35ft-40ft): Ship via freight
- Shipping cost calculated at checkout based on zip code
`;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, chatId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      return NextResponse.json({
        reply: "I'm here to help! For detailed information about Water Blob® products, please check our FAQ page or contact us directly.",
      });
    }

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: KNOWLEDGE_BASE },
    ];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recent = conversationHistory.slice(-10);
      messages.push(...recent);
    }

    messages.push({ role: 'user', content: message });

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content || '';

    // Log to database
    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO chatbot_conversations (session_id, conversation_history, user_message, ai_response, user_agent, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [chatId || 'unknown', JSON.stringify(conversationHistory || []), message, reply,
           request.headers.get('user-agent') || null, request.headers.get('x-forwarded-for') || null]
        );
      } catch (dbErr) {
        // silently handled
      }
    }

    return NextResponse.json({ reply, chatId });
  } catch (error) {
    return NextResponse.json({
      reply: "I apologize, I'm having trouble right now. Please try again in a moment, or feel free to browse our FAQ page or contact us directly.",
    }, { status: 500 });
  }
}
