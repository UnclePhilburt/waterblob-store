import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSquareClient } from '@/lib/square';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const squareClient = getSquareClient();
    if (!squareClient) {
      return NextResponse.json({ error: 'Square not configured' }, { status: 503 });
    }

    const result = await (squareClient.locationsApi as any).listLocations();
    const locations = result.result.locations || [];

    return NextResponse.json({
      hasAccess: true,
      locationCount: locations.length,
    });
  } catch (error) {
    return NextResponse.json({
      hasAccess: false,
      locationCount: 0,
      error: (error as Error).message,
    });
  }
}
