import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json();

    if (!events || !Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid events array' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const ua = request.headers.get('user-agent');
    const pool = getPool();

    if (pool) {
      try {
        for (const event of events) {
          await pool.query(
            `INSERT INTO analytics_events (event_type, page_url, user_id, session_id, data, ip_address, user_agent, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [event.type || 'page_view', event.page || event.path,
             event.userId || 'anonymous', event.sessionId || 'unknown',
             JSON.stringify({ ...event, serverTimestamp: Date.now(), ip }),
             ip, event.userAgent || ua]
          );
        }
        return NextResponse.json({ success: true, count: events.length }, { status: 201 });
      } catch (error) {
        // silently handled
      }
    }

    return NextResponse.json({ success: true, count: events.length }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
