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
    const page = parseInt(searchParams.get('page') || '0', 10);
    const eventType = searchParams.get('eventType');

    const conditions: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (timeRange !== 'all') {
      const interval = TIME_RANGE_MAP[timeRange];
      if (!interval) {
        return NextResponse.json({ error: 'Invalid timeRange' }, { status: 400 });
      }
      conditions.push(`created_at > NOW() - INTERVAL '${interval}'`);
    }

    if (eventType) {
      conditions.push(`event_type = $${paramIndex}`);
      values.push(eventType);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = page * 1000;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM analytics_events ${whereClause}`,
      values
    );

    const eventsResult = await pool.query(
      `SELECT * FROM analytics_events ${whereClause} ORDER BY created_at DESC LIMIT 1000 OFFSET $${paramIndex}`,
      [...values, offset]
    );

    return NextResponse.json({
      events: eventsResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
