import { NextRequest, NextResponse } from 'next/server';

const zoneMultipliers: Record<string, number> = {
  MO: 1.0, KS: 1.05, AR: 1.05, OK: 1.1,
  IA: 1.15, NE: 1.15, IL: 1.15, KY: 1.2, TN: 1.2,
  TX: 1.25, LA: 1.3, MS: 1.25,
  IN: 1.25, OH: 1.3, MI: 1.35, WI: 1.3, MN: 1.3, SD: 1.25, ND: 1.35,
  AL: 1.3, GA: 1.35, FL: 1.45, SC: 1.4, NC: 1.4,
  VA: 1.4, WV: 1.35, MD: 1.45, DC: 1.45, DE: 1.5,
  PA: 1.5, NJ: 1.55, NY: 1.55, CT: 1.6, MA: 1.6,
  VT: 1.65, NH: 1.65, ME: 1.7, RI: 1.6,
  CO: 1.2, NM: 1.3, AZ: 1.4, UT: 1.35, WY: 1.3, MT: 1.4, ID: 1.45, NV: 1.5,
  CA: 1.55, OR: 1.55, WA: 1.55,
  AK: 2.0, HI: 2.5,
};

function calculateFallbackShipping(weight: number, stateProvince: string) {
  const baseRate = 150;
  const perPoundRate = 0.75;
  const multiplier = zoneMultipliers[stateProvince?.toUpperCase()] || 1.5;
  const total = (baseRate + weight * perPoundRate) * multiplier;
  const transitDays = multiplier < 1.2 ? 5 : multiplier < 1.4 ? 7 : multiplier < 1.6 ? 8 : 10;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + transitDays);

  return {
    serviceLevel: 'Standard LTL Freight',
    quoteId: 'FALLBACK-' + Date.now(),
    totalCharges: Math.round(total * 100) / 100,
    transitDays,
    deliveryDate: deliveryDate.toISOString().split('T')[0],
    isFallback: true,
  };
}

// Estes token cache
let estesTokenCache = { token: null as string | null, expiresAt: 0 };

async function getEstesToken(): Promise<string> {
  const now = Date.now();
  if (estesTokenCache.token && estesTokenCache.expiresAt > now) {
    return estesTokenCache.token;
  }

  if (!process.env.ESTES_API_KEY || !process.env.ESTES_USERNAME || !process.env.ESTES_PASSWORD) {
    throw new Error('Estes credentials not configured');
  }

  const baseUrl = process.env.ESTES_USE_UAT === 'true'
    ? 'https://uat-cloudapi.estes-express.com'
    : 'https://cloudapi.estes-express.com';

  const basicAuth = Buffer.from(`${process.env.ESTES_USERNAME}:${process.env.ESTES_PASSWORD}`).toString('base64');

  const response = await fetch(`${baseUrl}/authenticate`, {
    method: 'POST',
    headers: {
      apikey: process.env.ESTES_API_KEY,
      accept: 'application/json',
      Authorization: `Basic ${basicAuth}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Estes auth failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  const token = data.access_token || data.token;
  if (!token) throw new Error('No token in Estes response');

  const expiresIn = data.expires_in ? data.expires_in * 1000 : 50 * 60 * 1000;
  estesTokenCache = { token, expiresAt: now + expiresIn - 60000 };
  return token;
}

export async function POST(request: NextRequest) {
  try {
    const { city, stateProvince, postalCode, weight } = await request.json();

    if (!city || !stateProvince || !postalCode || !weight) {
      return NextResponse.json({ error: 'Missing required fields: city, stateProvince, postalCode, weight' }, { status: 400 });
    }

    // Check if Estes is configured
    if (!process.env.ESTES_API_KEY || !process.env.ESTES_USERNAME || !process.env.ESTES_PASSWORD || !process.env.ESTES_ACCOUNT) {
      const fallbackRate = calculateFallbackShipping(weight, stateProvince);
      return NextResponse.json({ rates: [fallbackRate], fallback: true });
    }

    // Try Estes API
    try {
      const token = await getEstesToken();
      const baseUrl = process.env.ESTES_USE_UAT === 'true'
        ? 'https://uat-cloudapi.estes-express.com'
        : 'https://cloudapi.estes-express.com';

      const rateResponse = await fetch(`${baseUrl}/v1/rate-quotes`, {
        method: 'POST',
        headers: {
          apikey: process.env.ESTES_API_KEY!,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: process.env.ESTES_ACCOUNT,
          originPoint: { postalCode: '65803', countryCode: 'US', city: 'Springfield', stateProvince: 'MO' },
          destinationPoint: { postalCode, countryCode: 'US', city, stateProvince },
          payor: 'S',
          terms: 'P',
          stackable: false,
          baseCommodities: {
            commodity: [{ pieces: 1, weight, freightClass: '125' }],
          },
        }),
      });

      if (rateResponse.ok) {
        const rateData = await rateResponse.json();
        return NextResponse.json({ rates: rateData.charges || [rateData], fallback: false });
      }

      // Fall through to fallback
    } catch (estesError) {
      // Estes error, using fallback
    }

    const fallbackRate = calculateFallbackShipping(weight, stateProvince);
    return NextResponse.json({ rates: [fallbackRate], fallback: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get shipping quote' }, { status: 500 });
  }
}
