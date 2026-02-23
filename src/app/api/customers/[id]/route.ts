import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const customerResult = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
    if (customerResult.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = customerResult.rows[0];

    const ordersResult = await pool.query(
      'SELECT * FROM orders WHERE customer_email = $1 ORDER BY created_at DESC',
      [customer.email]
    );

    return NextResponse.json({ customer, orders: ordersResult.rows });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}
