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
