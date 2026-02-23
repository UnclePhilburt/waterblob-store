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

    const [totalResult, uniqueUsersResult, eventsByTypeResult] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM activity_log'),
      pool.query('SELECT COUNT(DISTINCT username) AS unique_users FROM activity_log'),
      pool.query('SELECT action, COUNT(*) AS count FROM activity_log GROUP BY action ORDER BY count DESC'),
    ]);

    return NextResponse.json({
      totalEvents: parseInt(totalResult.rows[0].total, 10),
      uniqueUsers: parseInt(uniqueUsersResult.rows[0].unique_users, 10),
      eventsByType: eventsByTypeResult.rows,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch activity stats' }, { status: 500 });
  }
}
