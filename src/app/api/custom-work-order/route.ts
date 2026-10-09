import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

async function ensureWorkOrderColumns(pool: ReturnType<typeof getPool>) {
  if (!pool) return;

  await pool.query(`
    ALTER TABLE work_orders
      ADD COLUMN IF NOT EXISTS work_order_number TEXT,
      ADD COLUMN IF NOT EXISTS customer_name TEXT,
      ADD COLUMN IF NOT EXISTS customer_email TEXT,
      ADD COLUMN IF NOT EXISTS customer_phone TEXT,
      ADD COLUMN IF NOT EXISTS items JSONB,
      ADD COLUMN IF NOT EXISTS drawings JSONB,
      ADD COLUMN IF NOT EXISTS payment_method TEXT,
      ADD COLUMN IF NOT EXISTS check_number TEXT,
      ADD COLUMN IF NOT EXISTS shipping_address JSONB,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'incomplete',
      ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);
}

function calculateTotal(items: Array<{ price?: number | string; quantity?: number | string }>): number {
  return items.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 1;
    return sum + price * quantity;
  }, 0);
}

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

    await ensureWorkOrderColumns(pool);

    const workOrderNumber = 'WO' + Date.now().toString(36).toUpperCase();
    const total = calculateTotal(items) + (Number(shipping?.cost) || 0) + (Number(customer.taxAmount) || 0);

    const result = await pool.query(
      `INSERT INTO work_orders (
        work_order_number, customer_name, customer_email, customer_phone,
        items, drawings, payment_method, check_number, shipping_address,
        notes, total, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'incomplete', NOW(), NOW())
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
        total,
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to create custom work order:', error);
    return NextResponse.json({ error: 'Failed to create work order', details: message }, { status: 500 });
  }
}
