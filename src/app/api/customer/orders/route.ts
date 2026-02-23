import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireCustomer } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireCustomer(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query(
      `SELECT id, order_number, items, total, status, shipping_address, tracking_number, created_at, updated_at
       FROM orders WHERE customer_email = $1 ORDER BY created_at DESC`,
      [auth.customer.email]
    );

    return NextResponse.json({
      success: true,
      orders: result.rows.map((o) => ({
        id: o.id, orderNumber: o.order_number, items: o.items,
        total: parseFloat(o.total), status: o.status,
        shippingAddress: o.shipping_address, trackingNumber: o.tracking_number,
        createdAt: o.created_at, updatedAt: o.updated_at,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
