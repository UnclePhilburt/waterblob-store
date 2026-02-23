import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const MOCK_PRODUCTS = [
  { id: 1, name: 'Water Blob® - Small', description: 'Perfect for individual use. Compact and portable.', price: 29.99, image_url: '/images/waterblob-action.jpg', stock: 50, category: 'blob', active: true },
  { id: 2, name: 'Water Blob® - Medium', description: 'Great for families. Larger capacity and durability.', price: 49.99, image_url: '/images/waterblob-action.jpg', stock: 30, category: 'blob', active: true },
  { id: 3, name: 'Water Blob® - Large', description: 'Commercial grade. Maximum capacity and performance.', price: 89.99, image_url: '/images/waterblob-action.jpg', stock: 15, category: 'blob', active: true },
  { id: 4, name: 'Water Blob® Accessories Pack', description: 'Everything you need to maintain your Water Blob®.', price: 19.99, image_url: '/images/waterblob-action.jpg', stock: 100, category: 'accessory', active: true },
];

export async function GET() {
  try {
    const cacheHeaders = {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    };

    const pool = getPool();
    if (!pool) return NextResponse.json(MOCK_PRODUCTS, { headers: cacheHeaders });

    const result = await pool.query('SELECT * FROM products WHERE active = true ORDER BY id');
    return NextResponse.json(result.rows, { headers: cacheHeaders });
  } catch (error) {
    return NextResponse.json(MOCK_PRODUCTS);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, price, image_url, model_url, stock, category, active } = await request.json();

    if (!name || !price) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const result = await pool.query(
      `INSERT INTO products (name, description, price, image_url, model_url, category, stock, active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [name, description, price, image_url, model_url || null, category, stock || 0, active !== false]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
