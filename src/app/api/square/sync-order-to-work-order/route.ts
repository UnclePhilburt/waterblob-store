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

    const { squareOrderId } = await request.json();
    if (!squareOrderId) {
      return NextResponse.json({ error: 'squareOrderId is required' }, { status: 400 });
    }

    // Retrieve the Square order
    const orderResult = await (squareClient.ordersApi as any).retrieveOrder(squareOrderId);
    const squareOrder = orderResult.result.order;

    if (!squareOrder) {
      return NextResponse.json({ error: 'Square order not found' }, { status: 404 });
    }

    // Extract customer info from the order
    let customerName = '';
    let customerEmail = '';
    let customerPhone = '';
    let shippingAddress = null;

    // Try to get customer details if customerId is present
    if (squareOrder.customerId) {
      try {
        const customerResult = await (squareClient.customersApi as any).retrieveCustomer(
          squareOrder.customerId
        );
        const sqCustomer = customerResult.result.customer;
        if (sqCustomer) {
          customerName = [sqCustomer.givenName, sqCustomer.familyName].filter(Boolean).join(' ').trim();
          customerEmail = sqCustomer.emailAddress || '';
          customerPhone = sqCustomer.phoneNumber || '';
        }
      } catch (custErr) {
        // silently handled
      }
    }

    // Extract shipping address from fulfillments
    if (squareOrder.fulfillments && squareOrder.fulfillments.length > 0) {
      const fulfillment = squareOrder.fulfillments[0];
      if (fulfillment.shipmentDetails?.recipient) {
        const recipient = fulfillment.shipmentDetails.recipient;
        customerName = customerName || recipient.displayName || '';
        customerEmail = customerEmail || recipient.emailAddress || '';
        customerPhone = customerPhone || recipient.phoneNumber || '';
        if (recipient.address) {
          shippingAddress = {
            addressLine1: recipient.address.addressLine1 || '',
            addressLine2: recipient.address.addressLine2 || '',
            city: recipient.address.locality || '',
            state: recipient.address.administrativeDistrictLevel1 || '',
            postalCode: recipient.address.postalCode || '',
            country: recipient.address.country || 'US',
          };
        }
      }
    }

    // Extract line items
    const items = (squareOrder.lineItems || []).map((item: any) => ({
      name: item.name || 'Unknown Item',
      quantity: parseInt(item.quantity) || 1,
      price: item.basePriceMoney ? Number(item.basePriceMoney.amount) / 100 : 0,
    }));

    // Generate work order number
    const workOrderNumber = 'WO' + Date.now().toString(36).toUpperCase();

    // Create work order in DB
    const woResult = await pool.query(
      `INSERT INTO work_orders (work_order_number, order_number, customer_name, customer_email,
        customer_phone, items, shipping_address, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'incomplete', NOW(), NOW()) RETURNING *`,
      [
        workOrderNumber,
        squareOrder.referenceId || squareOrderId,
        customerName || null,
        customerEmail || null,
        customerPhone || null,
        JSON.stringify(items),
        shippingAddress ? JSON.stringify(shippingAddress) : null,
        `Imported from Square Order: ${squareOrderId}`,
      ]
    );

    const workOrder = woResult.rows[0];

    return NextResponse.json({ success: true, workOrder });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create work order from Square order' }, { status: 500 });
  }
}
