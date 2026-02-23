import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

let errorLogs: Record<string, unknown>[] = [];
const MAX_LOGS = 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const errorData = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...body,
      ip,
      receivedAt: new Date().toISOString(),
    };

    errorLogs.unshift(errorData);
    if (errorLogs.length > MAX_LOGS) {
      errorLogs = errorLogs.slice(0, MAX_LOGS);
    }

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO error_logs (session_id, type, message, severity, url, user_agent, screen_size, viewport, stack, ip, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [errorData.sessionId, errorData.type, errorData.message, errorData.severity,
           errorData.url, errorData.userAgent, errorData.screenSize, errorData.viewport,
           errorData.stack, ip, JSON.stringify(errorData)]
        );
      } catch (dbError) {
        // silently handled
      }
    }

    return NextResponse.json({ success: true, id: errorData.id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
}
