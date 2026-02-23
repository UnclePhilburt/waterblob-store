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

    const result = await (squareClient.devicesApi as any).listDeviceCodes({
      locationId: process.env.SQUARE_LOCATION_ID,
      productType: 'TERMINAL_API',
    });

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
    return NextResponse.json({ error: 'Failed to list devices' }, { status: 500 });
  }
}
