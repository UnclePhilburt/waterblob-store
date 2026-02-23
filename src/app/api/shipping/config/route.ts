import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const defaultShippingConfig = {
  origin: { address: '2045 N National Ave', city: 'Springfield', state: 'MO', zip: '65803' },
  pallet: { length: 48, width: 40, height: 6, weight: 40 },
  defaultWeight: 200,
  defaultFreightClass: '125',
  products: {
    'Original Water Blob® - 30ft': { weight: 315, length: 42, width: 42, height: 12, carrier: 'estes', palletType: 'PLT', freightClass: '125' },
    'Original Water Blob® - 35ft': { weight: 355, length: 42, width: 42, height: 14, carrier: 'estes', palletType: 'PLT', freightClass: '125' },
    'Original Water Blob® - 40ft': { weight: 400, length: 48, width: 42, height: 16, carrier: 'estes', palletType: 'PLT', freightClass: '125' },
    'Weekender Water Blob® - 25ft': { weight: 125, length: 24, width: 18, height: 12, carrier: 'estes', palletType: 'PLT', freightClass: '125' },
    'Weekender Water Blob® - 30ft': { weight: 149, length: 28, width: 20, height: 14, carrier: 'estes', palletType: 'PLT', freightClass: '125' },
    'Weekender Water Blob® - 35ft': { weight: 160, length: 36, width: 36, height: 10, carrier: 'estes', palletType: 'PLT', freightClass: '125' },
    'Ski Tube - Single Rider': { weight: 12, length: 48, width: 12, height: 12, carrier: 'ups', palletType: 'PKG', freightClass: '125' },
    'Ski Tube - Double Rider': { weight: 18, length: 52, width: 16, height: 14, carrier: 'ups', palletType: 'PKG', freightClass: '125' },
  },
};

export async function GET() {
  try {
    const pool = getPool();
    if (pool) {
      const result = await pool.query('SELECT config FROM shipping_config WHERE id = 1');
      if (result.rows.length > 0) {
        const dbConfig = result.rows[0].config;
        return NextResponse.json({
          ...defaultShippingConfig,
          origin: dbConfig.origin || defaultShippingConfig.origin,
          pallet: dbConfig.pallet || defaultShippingConfig.pallet,
        });
      }
    }
    return NextResponse.json(defaultShippingConfig);
  } catch (error) {
    return NextResponse.json(defaultShippingConfig);
  }
}
