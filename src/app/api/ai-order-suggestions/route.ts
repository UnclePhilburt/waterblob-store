import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const { formData, items } = await request.json();
    if (!formData) {
      return NextResponse.json({ error: 'formData is required' }, { status: 400 });
    }

    const suggestions: Record<string, unknown>[] = [];

    // Search customers by name or email
    if (formData.customer_name || formData.customer_email) {
      const customerQuery = `
        SELECT id, email, name, phone, total_spent, order_count
        FROM customers
        WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%')
           OR ($2::text IS NULL OR email ILIKE '%' || $2 || '%')
        ORDER BY order_count DESC
        LIMIT 5
      `;
      const customerResult = await pool.query(customerQuery, [
        formData.customer_name || null,
        formData.customer_email || null,
      ]);

      for (const customer of customerResult.rows) {
        suggestions.push({
          type: 'customer',
          label: `${customer.name || customer.email} - ${customer.order_count} previous orders`,
          data: {
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
          },
        });
      }
    }

    // Search past work orders for similar items or customers
    if (formData.customer_email || (items && items.length > 0)) {
      const woQuery = `
        SELECT work_order_number, customer_name, customer_email, items, shipping_address, notes, status
        FROM work_orders
        WHERE ($1::text IS NULL OR customer_email = $1)
           OR ($2::text IS NULL OR customer_name ILIKE '%' || $2 || '%')
        ORDER BY created_at DESC
        LIMIT 5
      `;
      const woResult = await pool.query(woQuery, [
        formData.customer_email || null,
        formData.customer_name || null,
      ]);

      for (const wo of woResult.rows) {
        suggestions.push({
          type: 'work_order',
          label: `Previous order ${wo.work_order_number} (${wo.status})`,
          data: {
            customer_name: wo.customer_name,
            customer_email: wo.customer_email,
            items: wo.items,
            shipping_address: wo.shipping_address,
            notes: wo.notes,
          },
        });
      }
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get suggestions' }, { status: 500 });
  }
}
