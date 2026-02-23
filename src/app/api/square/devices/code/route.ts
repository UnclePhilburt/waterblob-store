import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSquareClient } from '@/lib/square';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const squareClient = getSquareClient();
    if (!squareClient) {
      return NextResponse.json({ error: 'Square not configured' }, { status: 503 });
    }

    const result = await (squareClient.devicesApi as any).createDeviceCode({
      idempotencyKey: `device-code-${Date.now()}`,
      deviceCode: {
        productType: 'TERMINAL_API',
        locationId: process.env.SQUARE_LOCATION_ID,
        name: 'Water Blob Terminal',
      },
    });

    const deviceCode = result.result.deviceCode;

    return NextResponse.json({
      code: deviceCode.code,
      deviceCodeId: deviceCode.id,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create device code' }, { status: 500 });
  }
}
