import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const DEFAULT_PRODUCTS = [
  {
    name: 'Water Blob\u00ae - Small',
    description: 'Perfect for individual use. Compact and portable.',
    price: 29.99,
    image_url: '/images/waterblob-action.jpg',
    stock: 50,
    category: 'blob',
  },
  {
    name: 'Water Blob\u00ae - Medium',
    description: 'Great for families. Larger capacity and durability.',
    price: 49.99,
    image_url: '/images/waterblob-action.jpg',
    stock: 30,
    category: 'blob',
  },
  {
    name: 'Water Blob\u00ae - Large',
    description: 'Commercial grade. Maximum capacity and performance.',
    price: 89.99,
    image_url: '/images/waterblob-action.jpg',
    stock: 15,
    category: 'blob',
  },
  {
    name: 'Water Blob\u00ae Accessories Pack',
    description: 'Everything you need to maintain your Water Blob\u00ae.',
    price: 19.99,
    image_url: '/images/waterblob-action.jpg',
    stock: 100,
    category: 'accessory',
  },
];

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 503 }
      );
    }

    await pool.query('DELETE FROM products');

    const insertedProducts = [];
    for (const product of DEFAULT_PRODUCTS) {
      const { rows } = await pool.query(
        `INSERT INTO products (name, description, price, image_url, stock, category, active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
         RETURNING *`,
        [
          product.name,
          product.description,
          product.price,
          product.image_url,
          product.stock,
          product.category,
        ]
      );
      insertedProducts.push(rows[0]);
    }

    return NextResponse.json({
      success: true,
      message: 'Products reset to default catalog',
      products: insertedProducts,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reset products' },
      { status: 500 }
    );
  }
}
