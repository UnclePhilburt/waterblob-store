import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireCustomer } from '@/lib/auth';

function formatAddress(addr: Record<string, unknown>) {
  return {
    id: addr.id, label: addr.label,
    firstName: addr.first_name, lastName: addr.last_name,
    addressLine1: addr.address_line1, addressLine2: addr.address_line2,
    city: addr.city, state: addr.state,
    postalCode: addr.postal_code, country: addr.country,
    phone: addr.phone, isDefault: addr.is_default,
  };
}

export async function GET(request: NextRequest) {
  const auth = requireCustomer(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query(
      'SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC',
      [auth.customer.customerId]
    );

    return NextResponse.json({ success: true, addresses: result.rows.map(formatAddress) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = requireCustomer(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { label, firstName, lastName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } =
      await request.json();

    if (!addressLine1 || !city || !postalCode) {
      return NextResponse.json({ error: 'Address line 1, city, and postal code are required' }, { status: 400 });
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    if (isDefault) {
      await pool.query('UPDATE customer_addresses SET is_default = false WHERE customer_id = $1', [auth.customer.customerId]);
    }

    const result = await pool.query(
      `INSERT INTO customer_addresses (customer_id, label, first_name, last_name, address_line1, address_line2, city, state, postal_code, country, phone, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [auth.customer.customerId, label || 'Home', firstName, lastName, addressLine1, addressLine2,
       city, state, postalCode, country || 'United States', phone, isDefault || false]
    );

    return NextResponse.json({ success: true, message: 'Address added successfully', address: formatAddress(result.rows[0]) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add address' }, { status: 500 });
  }
}
