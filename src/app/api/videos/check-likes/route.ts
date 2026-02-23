import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { session_id, video_ids } = await request.json();

    if (!session_id || !video_ids || !Array.isArray(video_ids)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { rows } = await pool.query(
      'SELECT video_id FROM video_likes WHERE session_id = $1 AND video_id = ANY($2)',
      [session_id, video_ids]
    );

    return NextResponse.json({ likedIds: rows.map((r) => r.video_id) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check likes' }, { status: 500 });
  }
}
