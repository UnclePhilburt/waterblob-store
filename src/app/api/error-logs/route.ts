import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) return NextResponse.json([]);

    const result = await pool.query(
      'SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 500'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    await pool.query('TRUNCATE error_logs');
    return NextResponse.json({ success: true, message: 'Error logs cleared' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear error logs' }, { status: 500 });
  }
}
