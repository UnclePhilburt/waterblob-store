import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { customer, items, drawings, paymentMethod, checkNumber, shipping } = await request.json();

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer info and at least one item are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const workOrderNumber = 'WO' + Date.now().toString(36).toUpperCase();

    const result = await pool.query(
      `INSERT INTO work_orders (
        work_order_number, customer_name, customer_email, customer_phone,
        items, drawings, payment_method, check_number, shipping_address,
        notes, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'incomplete', NOW(), NOW())
      RETURNING *`,
      [
        workOrderNumber,
        customer.name || null,
        customer.email || null,
        customer.phone || null,
        JSON.stringify(items),
        drawings ? JSON.stringify(drawings) : null,
        paymentMethod || null,
        checkNumber || null,
        shipping ? JSON.stringify(shipping) : null,
        customer.notes || null,
      ]
    );

    // Update or create customer record
    if (customer.email) {
      try {
        await pool.query(
          `INSERT INTO customers (email, name, phone, total_spent, order_count, last_order_at, created_at)
           VALUES ($1, $2, $3, 0, 1, NOW(), NOW())
           ON CONFLICT (email)
           DO UPDATE SET
             name = COALESCE($2, customers.name),
             phone = COALESCE($3, customers.phone),
             order_count = customers.order_count + 1,
             last_order_at = NOW()`,
          [customer.email, customer.name || null, customer.phone || null]
        );
      } catch (custErr) {
        // silently handled
      }
    }

    return NextResponse.json({ success: true, workOrder: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
  }
}
