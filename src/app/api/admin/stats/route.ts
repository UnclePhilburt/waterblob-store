import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json({
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        totalProducts: 0,
        message: 'Database not configured',
      });
    }

    const [ordersResult, revenueResult, pendingResult, productsResult] =
      await Promise.all([
        pool.query('SELECT COUNT(*) FROM orders'),
        pool.query(
          "SELECT COALESCE(SUM(total), 0) AS revenue FROM orders WHERE status = 'completed'"
        ),
        pool.query(
          "SELECT COUNT(*) FROM orders WHERE status = 'pending'"
        ),
        pool.query(
          'SELECT COUNT(*) FROM products WHERE active = true'
        ),
      ]);

    return NextResponse.json({
      totalOrders: parseInt(ordersResult.rows[0].count, 10),
      totalRevenue: parseFloat(revenueResult.rows[0].revenue),
      pendingOrders: parseInt(pendingResult.rows[0].count, 10),
      totalProducts: parseInt(productsResult.rows[0].count, 10),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
