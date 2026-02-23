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
    const color = searchParams.get('color');

    let query = `
      SELECT sq_ft_used, color, COUNT(*) as order_count
      FROM vinyl_usage_log
      WHERE created_at >= NOW() - INTERVAL '${period} days'
    `;
    const params: string[] = [];

    if (color) {
      params.push(color);
      query += ` AND color = $${params.length}`;
    }

    query += ' GROUP BY sq_ft_used, color ORDER BY order_count DESC LIMIT 20';

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch popular sizes' }, { status: 500 });
  }
}
