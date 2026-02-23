import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getSquareClient } from '@/lib/square';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const squareClient = getSquareClient();
    if (!squareClient) {
      return NextResponse.json({ error: 'Square not configured' }, { status: 503 });
    }

    let imported = 0;
    let updated = 0;
    let failed = 0;
    let cursor: string | undefined = undefined;

    // Paginate through all Square customers
    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listResult: any = await (squareClient.customersApi as any).listCustomers(
        cursor,
        undefined,
        undefined,
        undefined
      );

      const squareCustomers = listResult.result.customers || [];
      cursor = listResult.result.cursor;

      for (const sqCustomer of squareCustomers) {
        try {
          const email = sqCustomer.emailAddress;
          if (!email) {
            failed++;
            continue;
          }

          const name = [sqCustomer.givenName, sqCustomer.familyName]
            .filter(Boolean)
            .join(' ')
            .trim() || null;
          const phone = sqCustomer.phoneNumber || null;

          const result = await pool.query(
            `INSERT INTO customers (email, name, phone, square_customer_id, total_spent, order_count, created_at)
             VALUES ($1, $2, $3, $4, 0, 0, NOW())
             ON CONFLICT (email) DO UPDATE SET
               name = COALESCE(NULLIF($2, ''), customers.name),
               phone = COALESCE(NULLIF($3, ''), customers.phone),
               square_customer_id = $4,
               updated_at = CURRENT_TIMESTAMP
             RETURNING (xmax = 0) AS is_insert`,
            [email, name, phone, sqCustomer.id]
          );

          if (result.rows[0].is_insert) {
            imported++;
          } else {
            updated++;
          }
        } catch (customerError) {
          failed++;
        }
      }
    } while (cursor);

    return NextResponse.json({ imported, updated, failed });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import customers' }, { status: 500 });
  }
}
