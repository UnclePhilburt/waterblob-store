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
      SELECT DATE(created_at) as date, color, SUM(sq_ft_used) as total_sq_ft
      FROM vinyl_usage_log
      WHERE created_at >= NOW() - INTERVAL '${period} days'
    `;
    const params: string[] = [];

    if (color) {
      params.push(color);
      query += ` AND color = $${params.length}`;
    }

    query += ' GROUP BY DATE(created_at), color ORDER BY date DESC, color';

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vinyl usage' }, { status: 500 });
  }
}
