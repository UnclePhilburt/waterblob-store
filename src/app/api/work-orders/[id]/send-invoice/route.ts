import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getSquareClient } from '@/lib/square';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const pool = getPool();
    if (!pool) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const squareClient = getSquareClient();
    if (!squareClient) {
      return NextResponse.json(
        { error: 'Square not configured' },
        { status: 500 }
      );
    }

    const { id } = await params;

    // Get work order from DB
    const woResult = await pool.query(
      'SELECT * FROM work_orders WHERE id = $1',
      [id]
    );

    if (woResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    const workOrder = woResult.rows[0];

    if (!workOrder.customer_email) {
      return NextResponse.json(
        { error: 'Work order has no customer email' },
        { status: 400 }
      );
    }

    // Search for existing Square customer by email or create one
    let customerId: string;

    const searchResult = await (squareClient as any).customersApi.searchCustomers({
      query: {
        filter: {
          emailAddress: {
            exact: workOrder.customer_email,
          },
        },
      },
    });

    if (searchResult.result.customers && searchResult.result.customers.length > 0) {
      customerId = searchResult.result.customers[0].id;
    } else {
      const createResult = await (squareClient as any).customersApi.createCustomer({
        givenName: workOrder.customer_name || 'Customer',
        emailAddress: workOrder.customer_email,
        phoneNumber: workOrder.customer_phone || undefined,
      });
      customerId = createResult.result.customer.id;
    }

    // Parse items for the order
    const items = typeof workOrder.items === 'string'
      ? JSON.parse(workOrder.items)
      : workOrder.items || [];

    // Calculate total amount in cents
    const totalAmount = workOrder.total
      ? BigInt(Math.round(Number(workOrder.total) * 100))
      : BigInt(0);

    // Create Square order
    const locationId = process.env.SQUARE_LOCATION_ID;

    const orderResult = await (squareClient as any).ordersApi.createOrder({
      order: {
        locationId,
        customerId,
        lineItems: items.length > 0
          ? items.map((item: any) => ({
              name: item.name || 'Work Order Item',
              quantity: String(item.quantity || 1),
              basePriceMoney: {
                amount: totalAmount / BigInt(items.length || 1),
                currency: 'USD',
              },
            }))
          : [
              {
                name: `Work Order #${id}`,
                quantity: '1',
                basePriceMoney: {
                  amount: totalAmount,
                  currency: 'USD',
                },
              },
            ],
      },
      idempotencyKey: `wo-order-${id}-${Date.now()}`,
    });

    const orderId = orderResult.result.order.id;

    // Create invoice
    const invoiceResult = await (squareClient as any).invoicesApi.createInvoice({
      invoice: {
        orderId,
        locationId,
        primaryRecipient: {
          customerId,
        },
        paymentRequests: [
          {
            requestType: 'BALANCE',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            automaticPaymentSource: 'NONE',
          },
        ],
        deliveryMethod: 'EMAIL',
        title: `Work Order #${id}`,
      },
      idempotencyKey: `wo-invoice-${id}-${Date.now()}`,
    });

    const invoiceId = invoiceResult.result.invoice.id;
    const invoiceVersion = invoiceResult.result.invoice.version;

    // Publish the invoice
    await (squareClient as any).invoicesApi.publishInvoice(invoiceId, {
      version: invoiceVersion,
      idempotencyKey: `wo-publish-${id}-${Date.now()}`,
    });

    return NextResponse.json({ success: true, invoiceId });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
