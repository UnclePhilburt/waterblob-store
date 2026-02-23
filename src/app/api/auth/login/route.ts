import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { sessions, generateToken } from '@/lib/auth';
import { getUsers } from '@/lib/users';
import { applyRateLimit, authLimiter } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, authLimiter);
  if (limited) return limited;

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const users = await getUsers();
    const user = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const token = generateToken();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    sessions.set(token, {
      user: { username: user.username, role: user.role },
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
