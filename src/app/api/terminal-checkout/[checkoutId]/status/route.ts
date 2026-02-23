import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSquareClient } from '@/lib/square';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ checkoutId: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { checkoutId } = await params;
    const squareClient = getSquareClient();
    if (!squareClient) {
      return NextResponse.json({ error: 'Square not configured' }, { status: 503 });
    }

    const response = await (squareClient as any).terminalApi.getTerminalCheckout(checkoutId);
    const checkout = (response as any).result?.checkout;

    return NextResponse.json({
      status: checkout?.status,
      checkoutId,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch checkout status' }, { status: 500 });
  }
}
