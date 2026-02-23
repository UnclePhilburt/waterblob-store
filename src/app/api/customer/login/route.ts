import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getPool } from '@/lib/db';
import { customerSessions, generateToken } from '@/lib/auth';
import { applyRateLimit, authLimiter } from '@/lib/rate-limit';
import { isValidEmail } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, authLimiter);
  if (limited) return limited;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query(
      'SELECT id, email, password_hash, name, phone, total_spent, order_count FROM customers WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const customer = result.rows[0];
    if (!customer.password_hash) {
      return NextResponse.json({ error: 'No account found. Please register first.' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, customer.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const token = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    customerSessions.set(token, {
      customerId: customer.id,
      email: customer.email,
      name: customer.name,
      expiresAt,
    });

    await pool.query('UPDATE customers SET updated_at = NOW() WHERE id = $1', [customer.id]);

    const response = NextResponse.json({
      success: true,
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
    });

    response.cookies.set('customerToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
