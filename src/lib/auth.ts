import { NextRequest, NextResponse } from 'next/server';

interface AdminSession {
  user: { username: string; role: string };
  expiresAt: number;
}

interface CustomerSession {
  customerId: number;
  email: string;
  name: string;
  expiresAt: number;
}

/** In-memory admin/staff sessions */
export const sessions = new Map<string, AdminSession>();

/** In-memory customer sessions */
export const customerSessions = new Map<string, CustomerSession>();

/** Next midnight in America/Chicago, used for employee/admin workday sessions */
export function getNextCentralMidnightTimestamp(): number {
  const timeZone = 'America/Chicago';
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  const nextDayUtc = new Date(Date.UTC(year, month - 1, day + 1, 12));
  const nextParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(nextDayUtc);

  const nextYear = Number(nextParts.find((part) => part.type === 'year')?.value);
  const nextMonth = Number(nextParts.find((part) => part.type === 'month')?.value);
  const nextDay = Number(nextParts.find((part) => part.type === 'day')?.value);
  const midnightGuess = new Date(Date.UTC(nextYear, nextMonth - 1, nextDay));
  const offsetParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(midnightGuess);
  const asLocalUtc = Date.UTC(
    Number(offsetParts.find((part) => part.type === 'year')?.value),
    Number(offsetParts.find((part) => part.type === 'month')?.value) - 1,
    Number(offsetParts.find((part) => part.type === 'day')?.value),
    Number(offsetParts.find((part) => part.type === 'hour')?.value) % 24,
    Number(offsetParts.find((part) => part.type === 'minute')?.value),
    Number(offsetParts.find((part) => part.type === 'second')?.value)
  );
  const offset = asLocalUtc - midnightGuess.getTime();
  return Date.UTC(nextYear, nextMonth - 1, nextDay) - offset;
}

/** Extract bearer token from Authorization header */
export function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/** Extract customer token from cookie or Authorization header */
export function getCustomerToken(request: NextRequest): string | null {
  // First try httpOnly cookie
  const cookieToken = request.cookies.get('customerToken')?.value;
  if (cookieToken) return cookieToken;

  // Fall back to Authorization header
  return getBearerToken(request);
}

/** Validate admin auth — returns session user or error response */
export function requireAuth(
  request: NextRequest
): { user: AdminSession['user'] } | NextResponse {
  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized - No token provided' },
      { status: 401 }
    );
  }

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(token);
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or expired token' },
      { status: 401 }
    );
  }

  return { user: session.user };
}

/** Validate admin role — returns session user or error response */
export function requireAdmin(
  request: NextRequest
): { user: AdminSession['user'] } | NextResponse {
  const result = requireAuth(request);
  if (result instanceof NextResponse) return result;

  if (result.user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }

  return result;
}

/** Validate customer auth — returns session data or error response */
export function requireCustomer(
  request: NextRequest
): { customer: CustomerSession } | NextResponse {
  const token = getCustomerToken(request);
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized - No token provided' },
      { status: 401 }
    );
  }

  const session = customerSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) customerSessions.delete(token);
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or expired token' },
      { status: 401 }
    );
  }

  return { customer: session };
}

/** Generate a random session token */
export function generateToken(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
