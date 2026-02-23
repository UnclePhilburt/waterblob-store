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

    const productsResult = await pool.query('SELECT * FROM products WHERE active = true ORDER BY id');
    const products = productsResult.rows;

    let synced = 0;
    let failed = 0;

    for (const product of products) {
      try {
        const priceInCents = Math.round(parseFloat(product.price) * 100);

        if (product.square_catalog_id) {
          // Update existing catalog item
          // First retrieve the current item to get the version
          const retrieveResult = await (squareClient.catalogApi as any).retrieveCatalogObject(
            product.square_catalog_id
          );
          const currentObject = retrieveResult.result.object;

          await (squareClient.catalogApi as any).upsertCatalogObject({
            idempotencyKey: `sync-product-${product.id}-${Date.now()}`,
            object: {
              type: 'ITEM',
              id: product.square_catalog_id,
              version: currentObject?.version,
              itemData: {
                name: product.name,
                description: product.description || '',
                variations: [
                  {
                    type: 'ITEM_VARIATION',
                    id: `#variation-${product.id}`,
                    itemVariationData: {
                      name: 'Regular',
                      pricingType: 'FIXED_PRICING',
                      priceMoney: {
                        amount: BigInt(priceInCents),
                        currency: 'USD',
                      },
                    },
                  },
                ],
              },
            },
          } as any);
        } else {
          // Create new catalog item
          const createResult = await (squareClient.catalogApi as any).upsertCatalogObject({
            idempotencyKey: `sync-product-${product.id}-${Date.now()}`,
            object: {
              type: 'ITEM',
              id: `#product-${product.id}`,
              itemData: {
                name: product.name,
                description: product.description || '',
                variations: [
                  {
                    type: 'ITEM_VARIATION',
                    id: `#variation-${product.id}`,
                    itemVariationData: {
                      name: 'Regular',
                      pricingType: 'FIXED_PRICING',
                      priceMoney: {
                        amount: BigInt(priceInCents),
                        currency: 'USD',
                      },
                    },
                  },
                ],
              },
            },
          } as any);

          const catalogId = createResult.result.catalogObject!.id;
          await pool.query(
            'UPDATE products SET square_catalog_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [catalogId, product.id]
          );
        }

        synced++;
      } catch (productError) {
        failed++;
      }
    }

    return NextResponse.json({ synced, failed });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to sync products' }, { status: 500 });
  }
}
