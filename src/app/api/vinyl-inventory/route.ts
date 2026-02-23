import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query('SELECT * FROM vinyl_inventory');

    const rows = result.rows.map((row) => ({
      ...row,
      available_sq_ft: (row.rolls * 1500) - row.sq_ft_used,
    }));

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vinyl inventory' }, { status: 500 });
  }
}
