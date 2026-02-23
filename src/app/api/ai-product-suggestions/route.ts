import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getOpenAIClient } from '@/lib/openai';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 503 });
    }

    const { customerEmail } = await request.json();
    if (!customerEmail) {
      return NextResponse.json({ error: 'customerEmail is required' }, { status: 400 });
    }

    // Query last 10 orders for this customer
    const ordersResult = await pool.query(
      `SELECT order_number, items, total, created_at
       FROM orders
       WHERE customer_email = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [customerEmail]
    );

    if (ordersResult.rows.length === 0) {
      return NextResponse.json({
        suggestions: ['No order history found for this customer. Consider recommending our best sellers.'],
      });
    }

    // Get available products
    const productsResult = await pool.query(
      'SELECT name, description, price, category FROM products WHERE active = true ORDER BY name'
    );

    const orderHistory = ordersResult.rows.map((order) => ({
      orderNumber: order.order_number,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      total: order.total,
      date: order.created_at,
    }));

    const availableProducts = productsResult.rows.map((p) => ({
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
    }));

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a product recommendation assistant for Water Blob\u00ae, a company that sells water blobs and related accessories. Based on the customer's order history, suggest relevant products they might want to purchase next. Be concise and specific.`,
        },
        {
          role: 'user',
          content: `Customer order history:\n${JSON.stringify(orderHistory, null, 2)}\n\nAvailable products:\n${JSON.stringify(availableProducts, null, 2)}\n\nBased on their purchase history, what products would you recommend and why? Provide 3-5 specific suggestions.`,
        },
      ],
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content || '';
    const suggestions = reply
      .split('\n')
      .filter((line) => line.trim().length > 0);

    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get product suggestions' }, { status: 500 });
  }
}
