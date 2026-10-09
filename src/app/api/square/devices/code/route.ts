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

async function squareFetch(path: string, body: unknown) {
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    throw new Error('SQUARE_ACCESS_TOKEN is not configured');
  }

  const response = await fetch(`${getSquareApiBase()}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const first = data.errors?.[0];
    throw new Error([first?.code, first?.detail || response.statusText].filter(Boolean).join(': '));
  }

  return data;
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const squareClient = getSquareClient();
    if (!squareClient) {
      return NextResponse.json({ error: 'Square not configured' }, { status: 503 });
    }

    const result = await squareFetch('/v2/devices/codes', {
      idempotency_key: `device-code-${Date.now()}`,
      device_code: {
        product_type: 'TERMINAL_API',
        location_id: process.env.SQUARE_LOCATION_ID,
        name: 'Water Blob Terminal',
      },
    });

    const deviceCode = result.device_code;

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
