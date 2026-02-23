import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getSquareClient } from '@/lib/square';

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

    const squareClient = getSquareClient();
    if (!squareClient) {
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
      ? BigInt(Math.round(Number(workOrder.total) * 100))
      : BigInt(0);

    // Create terminal checkout
    const checkoutResult = await (squareClient as any).terminalApi.createTerminalCheckout({
      idempotencyKey: `wo-terminal-${id}-${Date.now()}`,
      checkout: {
        amountMoney: {
          amount: totalAmount,
          currency: 'USD',
        },
        deviceOptions: {
          deviceId,
        },
        referenceId: `work-order-${id}`,
        note: `Payment for Work Order #${id}`,
      },
    });

    const checkout = checkoutResult.result.checkout;

    return NextResponse.json({
      checkoutId: checkout.id,
      status: checkout.status,
      amount: Number(totalAmount) / 100,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create terminal checkout' },
      { status: 500 }
    );
  }
}
