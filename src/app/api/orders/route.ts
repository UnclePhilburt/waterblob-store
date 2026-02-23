import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getBrevoClient } from '@/lib/brevo';
import { isValidEmail, isValidPhone, isValidPrice } from '@/lib/sanitize';
import { applyRateLimit, orderLimiter } from '@/lib/rate-limit';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  const limited = applyRateLimit(request, orderLimiter);
  if (limited) return limited;

  try {
    const {
      order_number, customer_email, customer_name, customer_phone,
      items, total, shipping_address, notes, status, payment_method,
      payment_intent_id,
    } = await request.json();

    if (!customer_email || !items || !total) {
      return NextResponse.json({ error: 'Missing required fields: customer_email, items, and total are required' }, { status: 400 });
    }
    if (!isValidEmail(customer_email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (customer_phone && !isValidPhone(customer_phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }
    if (!isValidPrice(total)) {
      return NextResponse.json({ error: 'Invalid order total' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items must be a non-empty array' }, { status: 400 });
    }
    for (const item of items) {
      if (!item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return NextResponse.json({ error: 'Each item must have name, price, and quantity' }, { status: 400 });
      }
      if (!isValidPrice(item.price) || item.quantity < 1 || item.quantity > 100) {
        return NextResponse.json({ error: 'Invalid item price or quantity' }, { status: 400 });
      }
    }

    const pool = getPool();
    if (!pool) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const finalOrderNumber = order_number || ('WB' + Date.now().toString(36).toUpperCase());

    const result = await pool.query(
      `INSERT INTO orders (order_number, customer_email, customer_name, customer_phone, items, total, shipping_address, notes, status, payment_method, payment_intent_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *`,
      [finalOrderNumber, customer_email, customer_name || null, customer_phone || null,
       JSON.stringify(items), total, shipping_address ? JSON.stringify(shipping_address) : null,
       notes || null, status || 'pending', payment_method || 'pending', payment_intent_id || null]
    );

    // Update customer stats
    try {
      await pool.query(`
        INSERT INTO customers (email, name, phone, total_spent, order_count, last_order_at, created_at)
        VALUES ($1, $2, $3, $4, 1, NOW(), NOW())
        ON CONFLICT (email)
        DO UPDATE SET name = COALESCE($2, customers.name), phone = COALESCE($3, customers.phone),
          total_spent = customers.total_spent + $4, order_count = customers.order_count + 1, last_order_at = NOW()
      `, [customer_email, customer_name, customer_phone, total]);
    } catch (custErr) {
      // silently handled
    }

    // Create work order
    try {
      const workOrderNumber = 'WO' + Date.now().toString(36).toUpperCase();
      const pdfsDir = path.join(process.cwd(), 'pdfs');
      if (!fs.existsSync(pdfsDir)) fs.mkdirSync(pdfsDir, { recursive: true });

      const woResult = await pool.query(`
        INSERT INTO work_orders (work_order_number, order_id, order_number, customer_name,
          customer_email, customer_phone, items, shipping_address, notes, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'incomplete', NOW(), NOW()) RETURNING *
      `, [workOrderNumber, result.rows[0].id, finalOrderNumber, customer_name || null,
          customer_email, customer_phone || null, JSON.stringify(items),
          shipping_address ? JSON.stringify(shipping_address) : null, notes || null]);

      const workOrder = woResult.rows[0];

      // Save custom blob images
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.customImage) {
          try {
            const base64Data = item.customImage.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const imageName = `blob-custom-${workOrderNumber}-item${i}.png`;
            fs.writeFileSync(path.join(pdfsDir, imageName), buffer);
          } catch (imageErr) {
            // silently handled
          }
        }
      }

      // Send email notification
      const brevoClient = getBrevoClient();
      if (brevoClient && process.env.WORK_ORDER_EMAIL) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const brevo = require('@getbrevo/brevo');
          const sendSmtpEmail = new brevo.SendSmtpEmail();
          sendSmtpEmail.subject = `New Work Order: ${workOrderNumber}`;
          sendSmtpEmail.sender = { name: 'The Water Blob®', email: process.env.BREVO_FROM_EMAIL || 'noreply@waterblob.com' };
          sendSmtpEmail.to = [{ email: process.env.WORK_ORDER_EMAIL }];
          sendSmtpEmail.htmlContent = `
            <h2>New Work Order Received</h2>
            <p><strong>Work Order #:</strong> ${workOrderNumber}</p>
            <p><strong>Order #:</strong> ${finalOrderNumber}</p>
            <p><strong>Customer:</strong> ${customer_name || 'N/A'}</p>
            <p><strong>Email:</strong> ${customer_email}</p>
            <p><strong>Phone:</strong> ${customer_phone || 'N/A'}</p>
            <hr><p>Please see the Employee Hub for full details.</p>
          `;
          await brevoClient.sendTransacEmail(sendSmtpEmail);
        } catch (emailErr) {
          // silently handled
        }
      }

    } catch (workOrderErr) {
      // silently handled
    }

    return NextResponse.json({ success: true, order: result.rows[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
