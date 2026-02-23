import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    const items = [
      {
        name: 'Test Blob',
        quantity: 1,
        size: '30ft',
        color: 'Blue',
      },
    ];

    const result = await pool.query(
      `INSERT INTO work_orders (customer_name, customer_email, items, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      ['Test Customer', 'test@example.com', JSON.stringify(items), 'pending']
    );

    return NextResponse.json({ success: true, workOrder: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create test work order' },
      { status: 500 }
    );
  }
}
