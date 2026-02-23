import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort') || 'newest';
    const limit = searchParams.get('limit') || '50';

    let query = 'SELECT * FROM video_wall WHERE approved = true';
    const params: (string | number)[] = [];

    if (featured === 'true') {
      query += ' AND featured = true';
    }

    switch (sort) {
      case 'popular': query += ' ORDER BY likes DESC, views DESC'; break;
      case 'views': query += ' ORDER BY views DESC'; break;
      case 'oldest': query += ' ORDER BY created_at ASC'; break;
      default: query += ' ORDER BY created_at DESC';
    }

    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;

    const { rows } = await pool.query(query, params);
    return NextResponse.json(rows, {
      headers: {
        'Cache-Control': 'public, s-maxage=300',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
