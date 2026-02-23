import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

const TIME_RANGE_MAP: Record<string, string> = {
  '1h': '1 hour',
  '24h': '1 day',
  '7d': '7 days',
  '30d': '30 days',
};

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '24h';

    let timeCondition = '';
    if (timeRange !== 'all') {
      const interval = TIME_RANGE_MAP[timeRange];
      if (!interval) {
        return NextResponse.json({ error: 'Invalid timeRange' }, { status: 400 });
      }
      timeCondition = `WHERE created_at > NOW() - INTERVAL '${interval}'`;
    }

    const result = await pool.query(
      `SELECT
         COUNT(DISTINCT user_id) AS "uniqueVisitors",
         COUNT(DISTINCT session_id) AS "uniqueSessions",
         COUNT(*) FILTER (WHERE event_type = 'pageview') AS "pageViews",
         AVG((data->>'time_on_page')::numeric) FILTER (WHERE data->>'time_on_page' IS NOT NULL) AS "avgTimeOnPage"
       FROM analytics_events
       ${timeCondition}`
    );

    const row = result.rows[0];

    return NextResponse.json({
      uniqueVisitors: parseInt(row.uniqueVisitors, 10) || 0,
      uniqueSessions: parseInt(row.uniqueSessions, 10) || 0,
      pageViews: parseInt(row.pageViews, 10) || 0,
      avgTimeOnPage: row.avgTimeOnPage ? parseFloat(row.avgTimeOnPage) : 0,
      timeRange,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics summary' }, { status: 500 });
  }
}
