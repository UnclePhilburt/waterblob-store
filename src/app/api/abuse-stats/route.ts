import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const totalResult = await pool.query(
      'SELECT COUNT(*) as total_events, COUNT(DISTINCT ip_address) as unique_ips FROM abuse_logs'
    );

    const topIPsResult = await pool.query(
      'SELECT ip_address, COUNT(*) as count FROM abuse_logs GROUP BY ip_address ORDER BY count DESC LIMIT 10'
    );

    return NextResponse.json({
      totalEvents: parseInt(totalResult.rows[0].total_events),
      uniqueIPs: parseInt(totalResult.rows[0].unique_ips),
      topIPs: topIPsResult.rows,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch abuse stats' }, { status: 500 });
  }
}
