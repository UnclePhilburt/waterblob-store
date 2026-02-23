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
      `SELECT id, email, name, phone, organization, total_spent, order_count, last_order_at, created_at
       FROM customers WHERE id = $1`,
      [auth.customer.customerId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const c = result.rows[0];
    return NextResponse.json({
      success: true,
      customer: {
        id: c.id, email: c.email, name: c.name, phone: c.phone,
        organization: c.organization,
        totalSpent: parseFloat(c.total_spent) || 0,
        orderCount: parseInt(c.order_count) || 0,
        lastOrderAt: c.last_order_at, createdAt: c.created_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = requireCustomer(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { name, phone, organization } = await request.json();
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query(
      `UPDATE customers SET name = COALESCE($1, name), phone = COALESCE($2, phone),
       organization = COALESCE($3, organization), updated_at = NOW()
       WHERE id = $4 RETURNING id, email, name, phone, organization, total_spent, order_count`,
      [name, phone, organization, auth.customer.customerId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const c = result.rows[0];
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      customer: {
        id: c.id, email: c.email, name: c.name, phone: c.phone,
        organization: c.organization,
        totalSpent: parseFloat(c.total_spent) || 0,
        orderCount: parseInt(c.order_count) || 0,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
