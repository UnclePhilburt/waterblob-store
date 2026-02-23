import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getSquareClient } from '@/lib/square';

export async function GET() {
  if (!process.env.SQUARE_APPLICATION_ID) {
    return NextResponse.json(
      { error: 'Square not configured', message: 'Please set SQUARE_APPLICATION_ID' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    applicationId: process.env.SQUARE_APPLICATION_ID,
    locationId: process.env.SQUARE_LOCATION_ID,
    environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
  });
}

export async function POST(request: NextRequest) {
  try {
    const squareClient = getSquareClient();
    if (!squareClient) {
      return NextResponse.json({ error: 'Square not configured' }, { status: 503 });
    }

    const { sourceId, amount, orderId, customerEmail, customerName, items, shippingAddress, subtotal, tax } =
      await request.json();

    if (!sourceId || !amount) {
      return NextResponse.json({ error: 'Missing sourceId or amount' }, { status: 400 });
    }

    const amountInCents = Math.round(amount * 100);
    const pool = getPool();

    // Create or find Square customer
    let squareCustomerId: string | null = null;
    try {
      const searchResult = await squareClient.customersApi.searchCustomers({
        query: { filter: { emailAddress: { exact: customerEmail } } },
      });

      if (searchResult.result.customers && searchResult.result.customers.length > 0) {
        squareCustomerId = searchResult.result.customers[0].id!;
      } else {
        const nameParts = (customerName || '').split(' ');
        const createResult = await squareClient.customersApi.createCustomer({
          emailAddress: customerEmail,
          givenName: nameParts[0] || '',
          familyName: nameParts.slice(1).join(' ') || '',
          idempotencyKey: `customer-${customerEmail}-${Date.now()}`,
        });
        squareCustomerId = createResult.result.customer!.id!;

        if (pool) {
          await pool.query(
            'UPDATE customers SET square_customer_id = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
            [squareCustomerId, customerEmail]
          );
        }
      }
    } catch (customerError) {
      // silently handled
    }

    const idempotencyKey = `${orderId}-${Date.now()}`;

    // Create Square Order
    let squareOrderId: string | null = null;
    try {
      const lineItems = (items || []).map((item: { name?: string; productName?: string; quantity?: number; price: string | number }) => ({
        name: item.name || item.productName || 'Product',
        quantity: String(item.quantity || 1),
        basePriceMoney: {
          amount: BigInt(Math.round(parseFloat(String(item.price)) * 100)),
          currency: 'USD',
        },
      }));

      const orderRequest: Record<string, unknown> = {
        idempotencyKey: `order-${idempotencyKey}`,
        order: {
          locationId: process.env.SQUARE_LOCATION_ID,
          referenceId: orderId,
          lineItems: lineItems.length > 0 ? lineItems : [{
            name: `Order ${orderId}`,
            quantity: '1',
            basePriceMoney: { amount: BigInt(Math.round((subtotal || amount) * 100)), currency: 'USD' },
          }],
          ...(tax && tax > 0 && {
            taxes: [{ name: 'Sales Tax', percentage: '8', scope: 'ORDER' }],
          }),
          ...(squareCustomerId && { customerId: squareCustomerId }),
          ...(shippingAddress && {
            fulfillments: [{
              type: 'SHIPMENT',
              state: 'PROPOSED',
              shipmentDetails: {
                recipient: {
                  displayName: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || customerName,
                  emailAddress: customerEmail,
                  phoneNumber: shippingAddress.phone || '',
                  address: {
                    addressLine1: shippingAddress.addressLine1 || shippingAddress.address1 || '',
                    addressLine2: shippingAddress.addressLine2 || shippingAddress.address2 || '',
                    locality: shippingAddress.city || '',
                    administrativeDistrictLevel1: shippingAddress.state || '',
                    postalCode: shippingAddress.postalCode || shippingAddress.zip || '',
                    country: shippingAddress.country === 'Canada' ? 'CA' : 'US',
                  },
                },
              },
            }],
          }),
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderResult = await squareClient.ordersApi.createOrder(orderRequest as any);
      squareOrderId = orderResult.result.order!.id!;
    } catch (orderError) {
      // silently handled
    }

    // Process payment
    const paymentRequest: Record<string, unknown> = {
      sourceId,
      idempotencyKey,
      amountMoney: { amount: BigInt(amountInCents), currency: 'USD' },
      locationId: process.env.SQUARE_LOCATION_ID,
      note: `Order ${orderId}`,
      buyerEmailAddress: customerEmail,
      ...(squareCustomerId && { customerId: squareCustomerId }),
      ...(squareOrderId && { orderId: squareOrderId }),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = await squareClient.paymentsApi.createPayment(paymentRequest as any);

    if (pool && orderId) {
      await pool.query(
        'UPDATE orders SET status = $1, payment_method = $2, square_order_id = $3, updated_at = CURRENT_TIMESTAMP WHERE order_number = $4',
        ['paid', 'square', squareOrderId, orderId]
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: result.payment!.id,
      squareOrderId,
      status: result.payment!.status,
      customerId: squareCustomerId,
    });
  } catch (error) {
    const err = error as { result?: { errors: unknown } };
    if (err.result) {
      return NextResponse.json({ error: 'Payment failed', details: err.result.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
