import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { generateWorkOrderPdfBase64 } from '@/lib/work-order-pdf';

function getSquareApiBase() {
  return process.env.SQUARE_ENVIRONMENT === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';
}

async function ensureWorkOrderColumns(pool: NonNullable<ReturnType<typeof getPool>>) {
  await pool.query(`
    ALTER TABLE work_orders
      ADD COLUMN IF NOT EXISTS work_order_number TEXT,
      ADD COLUMN IF NOT EXISTS customer_name TEXT,
      ADD COLUMN IF NOT EXISTS customer_email TEXT,
      ADD COLUMN IF NOT EXISTS customer_phone TEXT,
      ADD COLUMN IF NOT EXISTS items JSONB,
      ADD COLUMN IF NOT EXISTS drawings JSONB,
      ADD COLUMN IF NOT EXISTS payment_method TEXT,
      ADD COLUMN IF NOT EXISTS payment_status TEXT,
      ADD COLUMN IF NOT EXISTS payment_notes TEXT,
      ADD COLUMN IF NOT EXISTS square_terminal_checkout_id TEXT,
      ADD COLUMN IF NOT EXISTS square_payment_id TEXT,
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS pdf_data TEXT,
      ADD COLUMN IF NOT EXISTS pdf_path TEXT,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'incomplete',
      ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);
}

async function squarePost(path: string, body: unknown) {
  if (!process.env.SQUARE_ACCESS_TOKEN) throw new Error('SQUARE_ACCESS_TOKEN is not configured');

  const response = await fetch(`${getSquareApiBase()}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const first = data.errors?.[0];
    throw new Error([first?.code, first?.detail || response.statusText].filter(Boolean).join(': '));
  }
  return data;
}

function normalizeItems(items: any[]) {
  return items.map((item) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const price = Math.max(0, Number(item.unitPrice ?? item.price) || 0);
    return {
      name: String(item.name || 'Custom item').trim(),
      quantity,
      price,
      type: 'ai_terminal',
      notes: String(item.notes || '').trim(),
    };
  });
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const deviceId = process.env.SQUARE_TERMINAL_DEVICE_ID;
    if (!deviceId) return NextResponse.json({ error: 'Terminal device not configured' }, { status: 500 });

    const { customer = {}, items = [], notes } = await request.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    await ensureWorkOrderColumns(pool);

    const normalizedItems = normalizeItems(items);
    const total = Number(normalizedItems
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2));

    if (total <= 0) {
      return NextResponse.json({ error: 'Total must be greater than $0.00' }, { status: 400 });
    }

    const workOrderNumber = 'WO' + Date.now().toString(36).toUpperCase();
    const workOrderResult = await pool.query(
      `INSERT INTO work_orders (
        work_order_number, customer_name, customer_email, customer_phone,
        items, drawings, payment_method, payment_status, payment_notes,
        notes, status, total, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, '[]'::jsonb, 'card', 'pending', $6, $7, 'incomplete', $8, NOW(), NOW())
      RETURNING *`,
      [
        workOrderNumber,
        customer.name || 'Terminal Customer',
        customer.email || null,
        customer.phone || null,
        JSON.stringify(normalizedItems),
        'Created from Water Blob AI',
        notes || null,
        total,
      ]
    );

    const workOrder = workOrderResult.rows[0];
    const amount = Math.round(total * 100);
    const checkoutResult = await squarePost('/v2/terminals/checkouts', {
      idempotency_key: `ai-terminal-${workOrder.id}-${Date.now()}`,
      checkout: {
        amount_money: { amount, currency: 'USD' },
        device_options: { device_id: deviceId },
        reference_id: `work-order-${workOrder.id}`,
        note: `Water Blob AI ${workOrder.work_order_number}`,
      },
    });

    const checkout = checkoutResult.checkout;
    const pdfPath = `/api/work-orders/${workOrder.id}/pdf`;
    const finalWorkOrder = {
      ...workOrder,
      square_terminal_checkout_id: checkout.id,
      payment_notes: `Square Terminal checkout ${checkout.id}`,
      pdf_path: pdfPath,
    };
    const pdfData = await generateWorkOrderPdfBase64(finalWorkOrder);

    await pool.query(
      `UPDATE work_orders
       SET square_terminal_checkout_id = $1,
           payment_notes = $2,
           pdf_data = $3,
           pdf_path = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [checkout.id, `Square Terminal checkout ${checkout.id}`, pdfData, pdfPath, workOrder.id]
    );

    return NextResponse.json({
      success: true,
      workOrder: finalWorkOrder,
      checkoutId: checkout.id,
      status: checkout.status,
      amount: total,
      pdfPath,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create terminal order', details }, { status: 500 });
  }
}
