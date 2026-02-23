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
    const { labor_hours, materials_used } = await request.json();

    const result = await pool.query(
      `UPDATE work_orders
       SET labor_hours = $1,
           materials_used = $2
       WHERE id = $3
       RETURNING *`,
      [labor_hours, materials_used, id]
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
      { error: 'Failed to update work order labor' },
      { status: 500 }
    );
  }
}
