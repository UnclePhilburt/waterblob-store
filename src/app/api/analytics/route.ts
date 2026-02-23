import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const analyticsStore: { events: Record<string, unknown>[]; maxEvents: number } = {
  events: [],
  maxEvents: 10000,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const event = { ...body, serverTimestamp: Date.now(), ip };

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO analytics_events (event_type, page_url, user_id, session_id, data, ip_address, user_agent, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [event.type || 'page_view', event.page || event.path,
           event.userId || 'anonymous', event.sessionId || 'unknown',
           JSON.stringify(event), ip, event.userAgent || request.headers.get('user-agent')]
        );
        return NextResponse.json({ success: true }, { status: 201 });
      } catch (error) {
        // silently handled
      }
    }

    analyticsStore.events.push(event);
    if (analyticsStore.events.length > analyticsStore.maxEvents) {
      analyticsStore.events.shift();
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
