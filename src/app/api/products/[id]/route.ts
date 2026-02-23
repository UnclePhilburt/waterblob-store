import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getSquareClient } from '@/lib/square';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query('SELECT * FROM products WHERE id = $1 AND active = true', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0], {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, price, image_url, model_url, stock, category, active } = await request.json();
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name), description = COALESCE($2, description),
           price = COALESCE($3, price), image_url = COALESCE($4, image_url),
           model_url = $5, category = COALESCE($6, category),
           stock = COALESCE($7, stock), active = COALESCE($8, active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [name, description, price, image_url, model_url || null, category, stock, active, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = productResult.rows[0];

    // Delete from Square if it has a catalog ID
    const squareClient = getSquareClient();
    if (squareClient && product.square_catalog_id) {
      try {
        await squareClient.catalogApi.deleteCatalogObject(product.square_catalog_id);
      } catch (squareError) {
        // silently handled
      }
    }

    const result = await pool.query(
      'UPDATE products SET active = false, square_catalog_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    return NextResponse.json({
      message: 'Product deleted successfully',
      product: result.rows[0],
      removedFromSquare: !!product.square_catalog_id,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
