import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query(
      `SELECT * FROM vinyl_inventory
       WHERE (rolls * 1500) - sq_ft_used < 1500
       ORDER BY ((rolls * 1500) - sq_ft_used) ASC`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vinyl alerts' }, { status: 500 });
  }
}
