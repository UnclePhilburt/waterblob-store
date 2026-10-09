import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

function getSquareApiBase() {
  return process.env.SQUARE_ENVIRONMENT === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';
}

function getSquareErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown Square error';
}

async function ensureTerminalPaymentColumns(pool: NonNullable<ReturnType<typeof getPool>>) {
  await pool.query(`
    ALTER TABLE work_orders
      ADD COLUMN IF NOT EXISTS payment_status TEXT,
      ADD COLUMN IF NOT EXISTS payment_method TEXT,
      ADD COLUMN IF NOT EXISTS payment_notes TEXT,
      ADD COLUMN IF NOT EXISTS square_terminal_checkout_id TEXT,
      ADD COLUMN IF NOT EXISTS square_payment_id TEXT,
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);
}

async function squarePost(path: string, body: unknown) {
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    throw new Error('SQUARE_ACCESS_TOKEN is not configured');
  }

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    if (!process.env.SQUARE_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Square not configured' },
        { status: 500 }
      );
    }

    const deviceId = process.env.SQUARE_TERMINAL_DEVICE_ID;
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Terminal device not configured' },
        { status: 500 }
      );
    }

    const { id } = await params;

    // Get work order
    const woResult = await pool.query(
      'SELECT * FROM work_orders WHERE id = $1',
      [id]
    );

    if (woResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    const workOrder = woResult.rows[0];
    const totalAmount = workOrder.total
      ? Math.round(Number(workOrder.total) * 100)
      : 0;

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Work order total must be greater than $0.00 before terminal payment' },
        { status: 400 }
      );
    }

    await ensureTerminalPaymentColumns(pool);

    // Create terminal checkout
    const checkoutResult = await squarePost('/v2/terminals/checkouts', {
      idempotency_key: `wo-terminal-${id}-${Date.now()}`,
      checkout: {
        amount_money: {
          amount: totalAmount,
          currency: 'USD',
        },
        device_options: {
          device_id: deviceId,
        },
        reference_id: `work-order-${id}`,
        note: `Payment for Work Order #${id}`,
      },
    });

    const checkout = checkoutResult.checkout;

    await pool.query(
      `UPDATE work_orders
       SET payment_status = $1,
           payment_method = $2,
           payment_notes = $3,
           square_terminal_checkout_id = $4,
           updated_at = NOW()
       WHERE id = $5`,
      ['pending', 'card', `Square Terminal checkout ${checkout.id}`, checkout.id, id]
    );

    return NextResponse.json({
      checkoutId: checkout.id,
      status: checkout.status,
      amount: totalAmount / 100,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create terminal checkout', details: getSquareErrorMessage(error) },
      { status: 500 }
    );
  }
}
