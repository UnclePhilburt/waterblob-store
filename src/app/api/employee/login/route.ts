import { NextRequest, NextResponse } from 'next/server';
import { sessions, generateToken } from '@/lib/auth';
import { applyRateLimit, authLimiter } from '@/lib/rate-limit';

const VALID_USERNAMES = ['john', 'paul', 'lorie', 'cody'];

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, authLimiter);
  if (limited) return limited;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const normalizedUsername = username.toLowerCase();

    if (!VALID_USERNAMES.includes(normalizedUsername)) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const expectedPassword = process.env[normalizedUsername];
    if (!expectedPassword || password !== expectedPassword) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = generateToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    sessions.set(token, {
      user: { username: normalizedUsername, role: 'employee' },
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      user: {
        username: normalizedUsername,
        role: 'employee',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
