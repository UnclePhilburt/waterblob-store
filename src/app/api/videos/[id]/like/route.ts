import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { session_id } = await request.json();

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { rows: existing } = await pool.query(
      'SELECT id FROM video_likes WHERE video_id = $1 AND session_id = $2',
      [id, session_id]
    );

    if (existing.length > 0) {
      await pool.query('DELETE FROM video_likes WHERE video_id = $1 AND session_id = $2', [id, session_id]);
      await pool.query('UPDATE video_wall SET likes = likes - 1 WHERE id = $1', [id]);
      return NextResponse.json({ liked: false });
    } else {
      await pool.query('INSERT INTO video_likes (video_id, session_id) VALUES ($1, $2)', [id, session_id]);
      await pool.query('UPDATE video_wall SET likes = likes + 1 WHERE id = $1', [id]);
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
