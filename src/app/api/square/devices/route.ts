import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSquareClient } from '@/lib/square';

function getSquareApiBase() {
  return process.env.SQUARE_ENVIRONMENT === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';
}

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

async function squareFetch(path: string) {
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    throw new Error('SQUARE_ACCESS_TOKEN is not configured');
  }

  const response = await fetch(`${getSquareApiBase()}${path}`, {
    headers: {
      'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const first = data.errors?.[0];
    throw new Error([first?.code, first?.detail || response.statusText].filter(Boolean).join(': '));
  }

  return data;
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const squareClient = getSquareClient();
    if (!squareClient) {
      return NextResponse.json({ error: 'Square not configured' }, { status: 503 });
    }

    const params = new URLSearchParams();
    if (process.env.SQUARE_LOCATION_ID) params.set('location_id', process.env.SQUARE_LOCATION_ID);
    params.set('product_type', 'TERMINAL_API');

    const result = await squareFetch(`/v2/devices/codes?${params.toString()}`);

    const devices = (result.device_codes || []).map((device: any) => ({
      id: device.id,
      name: device.name,
      code: device.code,
      status: device.status,
      deviceId: device.device_id,
      locationId: device.location_id,
      createdAt: device.created_at,
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
