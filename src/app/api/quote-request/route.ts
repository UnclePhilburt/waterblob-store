import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getBrevoClient } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName, lastName, email, phone, organization, locationType,
      timeline, slideLength, slideWidth, waterDepth, features, message, howHeard,
      _hp, _hp2, _hp3, _t,
    } = body;

    // Honeypot: if any hidden field was filled, it's a bot
    if (_hp || _hp2 || _hp3) {
      return NextResponse.json({ success: true, message: 'Quote request received! We will contact you shortly.' });
    }

    // Timing check: if submitted less than 2 seconds after page load, likely a bot
    if (_t && Date.now() - _t < 2000) {
      return NextResponse.json({ success: true, message: 'Quote request received! We will contact you shortly.' });
    }

    if (!firstName || !lastName || !email || !locationType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pool = getPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO quote_requests
           (first_name, last_name, email, phone, organization, location_type, timeline,
            slide_length, platform_height, water_depth, features, message, how_heard)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [firstName, lastName, email, phone || null, organization || null, locationType,
           timeline || null, slideLength || null, slideWidth || null, waterDepth || null,
           JSON.stringify(features || []), message || null, howHeard || null]
        );
      } catch (dbError) {
        // silently handled
      }
    }

    const brevoClient = getBrevoClient();
    const quoteEmail = process.env.QUOTE_EMAIL || process.env.WORK_ORDER_EMAIL;
    if (brevoClient && quoteEmail) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const brevo = require('@getbrevo/brevo');
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = `New Quote Request from ${firstName} ${lastName}`;
        sendSmtpEmail.sender = { name: 'Water Blob® Website', email: process.env.BREVO_FROM_EMAIL || 'noreply@waterblob.com' };
        sendSmtpEmail.to = [{ email: quoteEmail }];
        sendSmtpEmail.replyTo = { email, name: `${firstName} ${lastName}` };
        sendSmtpEmail.htmlContent = `
          <h2>New Quote Request</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p><strong>Organization:</strong> ${organization || 'N/A'}</p>
          <p><strong>Location Type:</strong> ${locationType}</p>
          <p><strong>Timeline:</strong> ${timeline || 'N/A'}</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        `;
        await brevoClient.sendTransacEmail(sendSmtpEmail);
      } catch (emailErr) {
        // silently handled
      }
    }

    return NextResponse.json({ success: true, message: 'Quote request received! We will contact you shortly.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit quote request' }, { status: 500 });
  }
}
