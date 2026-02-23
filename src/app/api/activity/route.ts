import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const result = requireAuth(request);
    if (result instanceof NextResponse) return result;

    if (result.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 1000);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = 'SELECT * FROM activity_log';
    let countQuery = 'SELECT COUNT(*) FROM activity_log';
    const queryParams: (string | number)[] = [];
    const countParams: (string | number)[] = [];

    if (username) {
      query += ' WHERE username = $1';
      countQuery += ' WHERE username = $1';
      queryParams.push(username);
      countParams.push(username);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(limit, offset);

    const [activitiesResult, totalResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams),
    ]);

    return NextResponse.json({
      activities: activitiesResult.rows,
      total: parseInt(totalResult.rows[0].count, 10),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 });
  }
}
