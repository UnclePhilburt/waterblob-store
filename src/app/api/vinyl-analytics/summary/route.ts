import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const totalUsageResult = await pool.query(
      `SELECT COALESCE(SUM(sq_ft_used), 0) as total_sq_ft,
              COUNT(*) as total_orders
       FROM vinyl_usage_log`
    );

    const byColorResult = await pool.query(
      `SELECT color,
              SUM(sq_ft_used) as total_sq_ft,
              COUNT(*) as order_count
       FROM vinyl_usage_log
       GROUP BY color
       ORDER BY total_sq_ft DESC`
    );

    const inventoryResult = await pool.query(
      `SELECT color, rolls, sq_ft_used,
              (rolls * 1500) - sq_ft_used as available_sq_ft
       FROM vinyl_inventory
       ORDER BY color`
    );

    return NextResponse.json({
      totalUsage: {
        totalSqFt: parseFloat(totalUsageResult.rows[0].total_sq_ft),
        totalOrders: parseInt(totalUsageResult.rows[0].total_orders),
      },
      byColor: byColorResult.rows,
      inventory: inventoryResult.rows,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vinyl summary' }, { status: 500 });
  }
}
