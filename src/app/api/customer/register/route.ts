import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getPool } from '@/lib/db';
import { customerSessions, generateToken } from '@/lib/auth';
import { applyRateLimit, authLimiter } from '@/lib/rate-limit';
import { isValidEmail, isValidPhone } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, authLimiter);
  if (limited) return limited;

  try {
    const { email, password, name, phone } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const existing = await pool.query('SELECT id, password_hash FROM customers WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0 && existing.rows[0].password_hash) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let customer;

    if (existing.rows.length > 0) {
      const result = await pool.query(
        `UPDATE customers SET password_hash = $1, name = COALESCE($2, name), phone = COALESCE($3, phone), updated_at = NOW()
         WHERE email = $4 RETURNING id, email, name, phone, total_spent, order_count, created_at`,
        [passwordHash, name, phone, email.toLowerCase()]
      );
      customer = result.rows[0];
    } else {
      const result = await pool.query(
        `INSERT INTO customers (email, password_hash, name, phone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, name, phone, total_spent, order_count, created_at`,
        [email.toLowerCase(), passwordHash, name, phone]
      );
      customer = result.rows[0];
    }

    const token = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    customerSessions.set(token, {
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      token,
      expiresAt,
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        totalSpent: parseFloat(customer.total_spent) || 0,
        orderCount: parseInt(customer.order_count) || 0,
      },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
