import { NextRequest, NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = requireCustomer(request);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    success: true,
    valid: true,
    customer: auth.customer,
  });
}
