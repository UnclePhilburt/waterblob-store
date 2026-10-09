import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { generateWorkOrderPdfBase64 } from '@/lib/work-order-pdf';

function getSquareApiBase() {
  return process.env.SQUARE_ENVIRONMENT === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';
}

async function ensureTerminalPaymentColumns(pool: NonNullable<ReturnType<typeof getPool>>) {
  await pool.query(`
    ALTER TABLE work_orders
      ADD COLUMN IF NOT EXISTS payment_status TEXT,
      ADD COLUMN IF NOT EXISTS payment_method TEXT,
      ADD COLUMN IF NOT EXISTS payment_notes TEXT,
      ADD COLUMN IF NOT EXISTS square_terminal_checkout_id TEXT,
      ADD COLUMN IF NOT EXISTS square_payment_id TEXT,
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS pdf_data TEXT,
      ADD COLUMN IF NOT EXISTS pdf_path TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
  `);
}

async function squareGet(path: string) {
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    throw new Error('SQUARE_ACCESS_TOKEN is not configured');
  }

  const response = await fetch(`${getSquareApiBase()}${path}`, {
    headers: {
      'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const first = data.errors?.[0];
    throw new Error([first?.code, first?.detail || response.statusText].filter(Boolean).join(': '));
  }

  return data;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ checkoutId: string }> }
) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { checkoutId } = await params;
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'Square not configured' }, { status: 503 });
    }

    const response = await squareGet(`/v2/terminals/checkouts/${encodeURIComponent(checkoutId)}`);
    const checkout = response.checkout;
    const status = checkout?.status;
    const paymentIds = checkout?.payment_ids || [];
    const referenceId = checkout?.reference_id || '';
    const workOrderId = referenceId.startsWith('work-order-')
      ? referenceId.replace('work-order-', '')
      : null;

    if (status === 'COMPLETED' && workOrderId) {
      const pool = getPool();
      if (pool) {
        await ensureTerminalPaymentColumns(pool);
        await pool.query(
          `UPDATE work_orders
           SET payment_status = $1,
               payment_method = $2,
               payment_notes = $3,
               square_terminal_checkout_id = $4,
               square_payment_id = $5,
               paid_at = COALESCE(paid_at, NOW()),
               updated_at = NOW()
           WHERE id = $6`,
          [
            'paid',
            'card',
            `Paid via Square Terminal checkout ${checkoutId}`,
            checkoutId,
            paymentIds[0] || null,
            workOrderId,
          ]
        );

        const workOrderResult = await pool.query('SELECT * FROM work_orders WHERE id = $1', [workOrderId]);
        const paidWorkOrder = workOrderResult.rows[0];
        if (paidWorkOrder) {
          const pdfPath = `/api/work-orders/${paidWorkOrder.id}/pdf`;
          const pdfData = await generateWorkOrderPdfBase64({ ...paidWorkOrder, pdf_path: pdfPath });
          await pool.query(
            `UPDATE work_orders
             SET pdf_data = $1,
                 pdf_path = $2,
                 updated_at = NOW()
             WHERE id = $3`,
            [pdfData, pdfPath, paidWorkOrder.id]
          );
        }
      }
    }

    return NextResponse.json({
      status,
      checkoutId,
      paymentIds,
      workOrderId,
      referenceId,
      pdfPath: workOrderId ? `/api/work-orders/${workOrderId}/pdf` : null,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch checkout status', details }, { status: 500 });
  }
}
