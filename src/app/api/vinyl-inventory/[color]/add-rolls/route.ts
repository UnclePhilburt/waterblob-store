import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ color: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { color } = await params;
    const { rolls } = await request.json();

    if (!rolls || typeof rolls !== 'number' || rolls < 1) {
      return NextResponse.json({ error: 'Valid number of rolls is required' }, { status: 400 });
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query(
      'UPDATE vinyl_inventory SET rolls = rolls + $1 WHERE color = $2 RETURNING *',
      [rolls, color]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Color not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add rolls' }, { status: 500 });
  }
}
