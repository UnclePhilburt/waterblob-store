import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSquareClient } from '@/lib/square';

function getSquareErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'result' in error) {
    const result = (error as { result?: { errors?: Array<{ detail?: string; code?: string }> } }).result;
    const first = result?.errors?.[0];
    if (first?.detail || first?.code) {
      return [first.code, first.detail].filter(Boolean).join(': ');
    }
  }

  return error instanceof Error ? error.message : 'Unknown Square error';
}

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
    const details = getSquareErrorMessage(error);
    console.error('Failed to create Square device code:', error);
    return NextResponse.json({ error: 'Failed to create device code', details }, { status: 500 });
  }
}
