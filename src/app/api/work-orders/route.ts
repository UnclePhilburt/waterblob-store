import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const status = request.nextUrl.searchParams.get('status');

    let query = 'SELECT * FROM work_orders';
    const values: string[] = [];

    if (status) {
      query += ' WHERE status = $1';
      values.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);

    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch work orders' },
      { status: 500 }
    );
  }
}
