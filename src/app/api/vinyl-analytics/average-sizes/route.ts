import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30');

    const result = await pool.query(
      `SELECT color,
              AVG(sq_ft_used) as avg_sq_ft,
              MIN(sq_ft_used) as min_sq_ft,
              MAX(sq_ft_used) as max_sq_ft,
              COUNT(*) as order_count
       FROM vinyl_usage_log
       WHERE created_at >= NOW() - INTERVAL '${period} days'
       GROUP BY color
       ORDER BY color`
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch average sizes' }, { status: 500 });
  }
}
