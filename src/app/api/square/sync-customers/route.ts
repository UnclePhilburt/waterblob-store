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

    const customersResult = await pool.query('SELECT * FROM customers ORDER BY id');
    const customers = customersResult.rows;

    let synced = 0;
    let failed = 0;

    for (const customer of customers) {
      try {
        if (!customer.email) {
          failed++;
          continue;
        }

        // Search for existing Square customer by email
        const searchResult = await (squareClient.customersApi as any).searchCustomers({
          query: { filter: { emailAddress: { exact: customer.email } } },
        });

        const nameParts = (customer.name || '').split(' ');
        const givenName = nameParts[0] || '';
        const familyName = nameParts.slice(1).join(' ') || '';

        if (searchResult.result.customers && searchResult.result.customers.length > 0) {
          // Update existing Square customer
          const squareCustomer = searchResult.result.customers[0];
          await (squareClient.customersApi as any).updateCustomer(squareCustomer.id, {
            givenName,
            familyName,
            emailAddress: customer.email,
            phoneNumber: customer.phone || undefined,
          });

          // Store Square customer ID in our DB
          await pool.query(
            'UPDATE customers SET square_customer_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [squareCustomer.id, customer.id]
          );
        } else {
          // Create new Square customer
          const createResult = await (squareClient.customersApi as any).createCustomer({
            idempotencyKey: `sync-customer-${customer.id}-${Date.now()}`,
            givenName,
            familyName,
            emailAddress: customer.email,
            phoneNumber: customer.phone || undefined,
          });

          const newSquareId = createResult.result.customer!.id!;
          await pool.query(
            'UPDATE customers SET square_customer_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [newSquareId, customer.id]
          );
        }

        synced++;
      } catch (customerError) {
        failed++;
      }
    }

    return NextResponse.json({ synced, failed });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sync customers' }, { status: 500 });
  }
}
