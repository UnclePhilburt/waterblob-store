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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireCustomer(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { label, firstName, lastName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault } =
      await request.json();

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const check = await pool.query('SELECT id FROM customer_addresses WHERE id = $1 AND customer_id = $2', [id, auth.customer.customerId]);
    if (check.rows.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    if (isDefault) {
      await pool.query('UPDATE customer_addresses SET is_default = false WHERE customer_id = $1', [auth.customer.customerId]);
    }

    const result = await pool.query(
      `UPDATE customer_addresses SET
        label = COALESCE($1, label), first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name),
        address_line1 = COALESCE($4, address_line1), address_line2 = $5, city = COALESCE($6, city),
        state = $7, postal_code = COALESCE($8, postal_code), country = COALESCE($9, country),
        phone = $10, is_default = COALESCE($11, is_default), updated_at = NOW()
       WHERE id = $12 AND customer_id = $13 RETURNING *`,
      [label, firstName, lastName, addressLine1, addressLine2, city, state, postalCode, country, phone, isDefault, id, auth.customer.customerId]
    );

    return NextResponse.json({ success: true, message: 'Address updated successfully', address: formatAddress(result.rows[0]) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireCustomer(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query(
      'DELETE FROM customer_addresses WHERE id = $1 AND customer_id = $2 RETURNING id',
      [id, auth.customer.customerId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 });
  }
}
