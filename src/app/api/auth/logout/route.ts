import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, sessions, getBearerToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const token = getBearerToken(request);
  if (token) sessions.delete(token);

  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
