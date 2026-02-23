import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getBrevoClient } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, subject, message, _hp, _t } = body;

    // Honeypot: if the hidden field was filled, it's a bot
    if (_hp) {
      // Return success to not tip off the bot, but do nothing
      return NextResponse.json({ success: true, message: 'Thank you for your message! We will get back to you shortly.' });
    }

    // Timing check: if submitted less than 2 seconds after page load, likely a bot
    if (_t && Date.now() - _t < 2000) {
      return NextResponse.json({ success: true, message: 'Thank you for your message! We will get back to you shortly.' });
    }

    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO contact_messages (first_name, last_name, email, phone, subject, message, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
          [firstName, lastName, email, phone || null, subject, message]
        );
      } catch (dbError) {
        // silently handled
      }
    }

    const brevoClient = getBrevoClient();
    const contactEmail = process.env.WORK_ORDER_EMAIL || 'lorie@thewaterblob.com';
    if (brevoClient && contactEmail) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const brevo = require('@getbrevo/brevo');
        const subjectLabels: Record<string, string> = {
          general: 'General Inquiry', quote: 'Request a Quote', custom: 'Custom Order',
          support: 'Product Support', warranty: 'Warranty Question',
          shipping: 'Shipping Question', other: 'Other',
        };
        const subjectLabel = subjectLabels[subject] || subject;

        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = `New Contact Form: ${subjectLabel} from ${firstName} ${lastName}`;
        sendSmtpEmail.sender = { name: 'Water Blob® Website', email: process.env.BREVO_FROM_EMAIL || 'noreply@waterblob.com' };
        sendSmtpEmail.to = contactEmail.split(',').map((e: string) => ({ email: e.trim() }));
        sendSmtpEmail.replyTo = { email, name: `${firstName} ${lastName}` };
        sendSmtpEmail.htmlContent = `
          <h2>New Contact Form: ${subjectLabel}</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `;
        await brevoClient.sendTransacEmail(sendSmtpEmail);
      } catch (emailErr) {
        // silently handled
      }
    }

    return NextResponse.json({ success: true, message: 'Thank you for your message! We will get back to you shortly.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit contact form' }, { status: 500 });
  }
}
