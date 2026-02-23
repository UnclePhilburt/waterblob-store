import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const result = requireAuth(request);
    if (result instanceof NextResponse) return result;

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { action, details } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const username = result.user.username;
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const insertResult = await pool.query(
      `INSERT INTO activity_log (username, action, details, ip, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [username, action, details || null, ip, userAgent]
    );

    return NextResponse.json({
      success: true,
      entry: insertResult.rows[0],
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}
