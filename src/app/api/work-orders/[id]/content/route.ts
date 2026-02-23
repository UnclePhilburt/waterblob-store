import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(
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
    const { customer, items, drawings } = await request.json();

    const result = await pool.query(
      `UPDATE work_orders
       SET customer_name = $1,
           customer_email = $2,
           customer_phone = $3,
           items = $4,
           notes = $5
       WHERE id = $6
       RETURNING *`,
      [
        customer?.name || null,
        customer?.email || null,
        customer?.phone || null,
        JSON.stringify(items),
        drawings || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update work order content' },
      { status: 500 }
    );
  }
}
