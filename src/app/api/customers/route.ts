import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query('SELECT * FROM customers ORDER BY total_spent DESC');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, phone, order_total } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query(
      `INSERT INTO customers (email, name, phone, total_spent, order_count, last_order_at, created_at)
       VALUES ($1, $2, $3, $4, 1, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET
         name = COALESCE($2, customers.name),
         phone = COALESCE($3, customers.phone),
         total_spent = customers.total_spent + $4,
         order_count = customers.order_count + 1,
         last_order_at = NOW()
       RETURNING *`,
      [email, name || null, phone || null, order_total || 0]
    );

    return NextResponse.json({ success: true, customer: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upsert customer' }, { status: 500 });
  }
}
