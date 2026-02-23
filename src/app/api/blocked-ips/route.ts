import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { ip_address, reason, permanent, durationHours } = await request.json();

    if (!ip_address) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const expiresAt = permanent
      ? null
      : new Date(Date.now() + (durationHours || 24) * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO blocked_ips (ip_address, reason, permanent, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [ip_address, reason || null, permanent || false, expiresAt]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to block IP' }, { status: 500 });
  }
}
