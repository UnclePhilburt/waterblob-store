import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getSquareClient } from '@/lib/square';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const squareClient = getSquareClient();
    if (!squareClient) {
      return NextResponse.json({ error: 'Square not configured' }, { status: 503 });
    }

    let imported = 0;
    let updated = 0;
    let failed = 0;
    let cursor: string | undefined = undefined;

    // Paginate through all Square catalog items
    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listResult: any = await (squareClient.catalogApi as any).listCatalog(
        cursor,
        'ITEM'
      );

      const catalogObjects = listResult.result.objects || [];
      cursor = listResult.result.cursor;

      for (const catalogItem of catalogObjects) {
        try {
          const itemData = catalogItem.itemData;
          if (!itemData) {
            failed++;
            continue;
          }

          const name = itemData.name || 'Unnamed Product';
          const description = itemData.description || '';
          const category = itemData.categoryId || 'general';

          // Get price from the first variation
          let price = 0;
          if (itemData.variations && itemData.variations.length > 0) {
            const variation = itemData.variations[0];
            const priceMoney = variation.itemVariationData?.priceMoney;
            if (priceMoney && priceMoney.amount) {
              price = Number(priceMoney.amount) / 100;
            }
          }

          const result = await pool.query(
            `INSERT INTO products (name, description, price, category, square_catalog_id, active, stock, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, true, 0, NOW(), NOW())
             ON CONFLICT (square_catalog_id) DO UPDATE SET
               name = $1,
               description = $2,
               price = $3,
               category = $4,
               active = true,
               updated_at = CURRENT_TIMESTAMP
             RETURNING (xmax = 0) AS is_insert`,
            [name, description, price, category, catalogItem.id]
          );

          if (result.rows[0].is_insert) {
            imported++;
          } else {
            updated++;
          }
        } catch (productError) {
          failed++;
        }
      }
    } while (cursor);

    return NextResponse.json({ imported, updated, failed });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import products' }, { status: 500 });
  }
}
