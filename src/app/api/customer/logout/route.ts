import { NextRequest, NextResponse } from 'next/server';
import { requireCustomer, customerSessions, getCustomerToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = requireCustomer(request);
  if (auth instanceof NextResponse) return auth;

  const token = getCustomerToken(request);
  if (token) customerSessions.delete(token);

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete('customerToken');
  return response;
}
