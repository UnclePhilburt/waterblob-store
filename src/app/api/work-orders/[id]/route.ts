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
    const { status } = await request.json();

    let query: string;
    let values: (string | number)[];

    if (status === 'complete') {
      query =
        'UPDATE work_orders SET status = $1, completed_at = NOW() WHERE id = $2 RETURNING *';
      values = [status, id];
    } else {
      query =
        'UPDATE work_orders SET status = $1 WHERE id = $2 RETURNING *';
      values = [status, id];
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update work order' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const result = await pool.query(
      'DELETE FROM work_orders WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Work order ${id} deleted successfully`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete work order' },
      { status: 500 }
    );
  }
}
