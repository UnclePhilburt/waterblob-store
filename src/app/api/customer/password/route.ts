import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getPool } from '@/lib/db';
import { requireCustomer } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  const auth = requireCustomer(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query('SELECT password_hash FROM customers WHERE id = $1', [auth.customer.customerId]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE customers SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newPasswordHash, auth.customer.customerId]);

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
