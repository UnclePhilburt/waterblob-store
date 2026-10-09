import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getOpenAIClient } from '@/lib/openai';

const FALLBACK_PRODUCTS = [
  { name: 'Original Water Blob® - 30ft', description: 'Commercial Water Blob', price: 0, category: 'Water Blob' },
  { name: 'Original Water Blob® - 35ft', description: 'Commercial Water Blob', price: 0, category: 'Water Blob' },
  { name: 'Original Water Blob® - 40ft', description: 'Commercial Water Blob', price: 0, category: 'Water Blob' },
  { name: 'Weekender Water Blob® - 25ft', description: 'Weekender Water Blob', price: 0, category: 'Water Blob' },
  { name: 'Weekender Water Blob® - 30ft', description: 'Weekender Water Blob', price: 0, category: 'Water Blob' },
];

async function getProducts() {
  const pool = getPool();
  if (!pool) return FALLBACK_PRODUCTS;

  try {
    const result = await pool.query(
      'SELECT name, description, price, category FROM products WHERE active = true ORDER BY name'
    );
    return result.rows.length > 0 ? result.rows : FALLBACK_PRODUCTS;
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

async function getExtraInfo() {
  try {
    return await readFile(
      path.join(process.cwd(), 'public', 'employee', 'terminal-order-info.txt'),
      'utf8'
    );
  } catch {
    return '';
  }
}

function normalizeCart(parsed: any) {
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  const normalizedItems = items.map((item: any) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    return {
      name: String(item.name || 'Custom item').trim(),
      quantity,
      unitPrice,
      total: Number((quantity * unitPrice).toFixed(2)),
      notes: String(item.notes || '').trim(),
      confidence: item.confidence === 'high' ? 'high' : item.confidence === 'medium' ? 'medium' : 'low',
    };
  });

  const subtotal = normalizedItems.reduce((sum: number, item: any) => sum + item.total, 0);

  return {
    items: normalizedItems,
    subtotal: Number(subtotal.toFixed(2)),
    questions: Array.isArray(parsed.questions) ? parsed.questions.map(String) : [],
    notes: String(parsed.notes || '').trim(),
  };
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 503 });
    }

    const { message } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const [products, extraInfo] = await Promise.all([getProducts(), getExtraInfo()]);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You turn employee shorthand into a Water Blob order cart.

Rules:
- Return JSON only with keys: items, questions, notes.
- items must be an array of { name, quantity, unitPrice, notes, confidence }.
- unitPrice is dollars, not cents.
- Use the product catalog prices when a matching item exists.
- Use the extra notes text for accessory/custom pricing.
- If the extra notes include an exact listed price for a finished item, use that exact price.
- For custom vinyl by dimensions, calculate square feet and multiply by the correct vinyl square-foot rate from the extra notes.
- For custom straps/webbing, use exact finished strap prices first. Only use per-foot webbing rates when the requested strap is custom or does not match a listed finished item.
- Put any formula used in the item notes, for example "10 ft x 10 ft = 100 sq ft x $2.10".
- If price is unknown, set unitPrice to 0, confidence to low, and add a question.
- Do not invent prices. Employees will review before payment.

Product catalog:
${JSON.stringify(products, null, 2)}

Extra pricing/info text:
${extraInfo}`,
        },
        { role: 'user', content: message },
      ],
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    return NextResponse.json(normalizeCart(parsed));
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to parse order', details }, { status: 500 });
  }
}
