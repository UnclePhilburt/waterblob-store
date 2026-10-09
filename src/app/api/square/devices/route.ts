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

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const squareClient = getSquareClient();
    if (!squareClient) {
      return NextResponse.json({ error: 'Square not configured' }, { status: 503 });
    }

    const result = await (squareClient.devicesApi as any).listDeviceCodes(
      undefined,
      process.env.SQUARE_LOCATION_ID,
      'TERMINAL_API'
    );

    const devices = (result.result.deviceCodes || []).map((device: any) => ({
      id: device.id,
      name: device.name,
      code: device.code,
      status: device.status,
      deviceId: device.deviceId,
      locationId: device.locationId,
      createdAt: device.createdAt,
    }));

    return NextResponse.json({
      devices,
      configuredDeviceId: process.env.SQUARE_TERMINAL_DEVICE_ID || null,
    });
  } catch (error) {
    const details = getSquareErrorMessage(error);
    console.error('Failed to list Square devices:', error);
    return NextResponse.json({ error: 'Failed to list devices', details }, { status: 500 });
  }
}
