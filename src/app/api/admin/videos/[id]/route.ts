import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { approved, featured } = await request.json();

    const pool = getPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { rows } = await pool.query(
      `UPDATE video_wall
       SET approved = COALESCE($1, approved),
           featured = COALESCE($2, featured)
       WHERE id = $3
       RETURNING *`,
      [approved, featured, id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const pool = getPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    const { rows } = await pool.query(
      'DELETE FROM video_wall WHERE id = $1 RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Video deleted successfully',
      video: rows[0],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}
