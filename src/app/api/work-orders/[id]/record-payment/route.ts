import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

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

    const { id } = await params;
    const { paymentMethod, checkNumber } = await request.json();

    const paymentNotes = checkNumber
      ? `${paymentMethod} - Check #${checkNumber}`
      : paymentMethod;

    const result = await pool.query(
      `UPDATE work_orders
       SET payment_status = $1,
           payment_method = $2,
           payment_notes = $3
       WHERE id = $4
       RETURNING *`,
      ['paid', paymentMethod, paymentNotes, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, workOrder: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}
