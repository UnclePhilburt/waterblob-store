import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { getBrevoClient } from '@/lib/brevo';

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

    const { id } = await params;

    const result = await pool.query(
      'UPDATE work_orders SET status = $1, completed_at = NOW() WHERE id = $2 RETURNING *',
      ['complete', id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    const workOrder = result.rows[0];

    // Optionally send email notification via Brevo
    const brevo = getBrevoClient();
    if (brevo && workOrder.customer_email) {
      try {
        const sendSmtpEmail = {
          to: [{ email: workOrder.customer_email, name: workOrder.customer_name }],
          sender: {
            email: process.env.BREVO_SENDER_EMAIL || 'noreply@waterblob.com',
            name: process.env.BREVO_SENDER_NAME || 'Water Blob',
          },
          subject: `Your Work Order #${id} is Complete`,
          htmlContent: `
            <h2>Your work order is complete!</h2>
            <p>Hi ${workOrder.customer_name || 'Customer'},</p>
            <p>Your work order <strong>#${id}</strong> has been completed.</p>
            <p>Thank you for your business!</p>
          `,
        };
        await brevo.sendTransacEmail(sendSmtpEmail);
      } catch (emailError) {
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ success: true, workOrder });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to complete work order' },
      { status: 500 }
    );
  }
}
