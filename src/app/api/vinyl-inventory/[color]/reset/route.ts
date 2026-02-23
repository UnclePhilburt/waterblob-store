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
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query(
      'UPDATE vinyl_inventory SET sq_ft_used = 0, last_reset_at = NOW() WHERE color = $1 RETURNING *',
      [color]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Color not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset vinyl usage' }, { status: 500 });
  }
}
