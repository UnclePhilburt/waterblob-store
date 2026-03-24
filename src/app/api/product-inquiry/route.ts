import { NextRequest, NextResponse } from 'next/server';
import { getBrevoClient } from '@/lib/brevo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      message,
      productName,
      productPrice,
      productSize,
      quantity,
      customization,
      _hp,
      _t,
    } = body;

    // Honeypot check
    if (_hp) {
      return NextResponse.json({ success: true, message: 'Thank you! We will be in touch shortly.' });
    }

    // Timing check
    if (_t && Date.now() - _t < 2000) {
      return NextResponse.json({ success: true, message: 'Thank you! We will be in touch shortly.' });
    }

    if (!name || !email || !phone || !productName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Format customization for the email
    let customizationHtml = '';
    if (customization) {
      try {
        const colors = JSON.parse(customization);
        const colorEntries = Object.entries(colors)
          .map(([part, color]) => `<li><strong>${part}:</strong> ${color}</li>`)
          .join('');
        customizationHtml = `
          <h3>Color Customization</h3>
          <ul>${colorEntries}</ul>
        `;
      } catch {
        customizationHtml = `<p><strong>Customization:</strong> ${customization}</p>`;
      }
    }

    const brevoClient = getBrevoClient();
    const contactEmail = process.env.WORK_ORDER_EMAIL || 'lorie@thewaterblob.com';

    if (brevoClient && contactEmail) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const brevo = require('@getbrevo/brevo');
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = `Product Inquiry: ${productName} from ${name}`;
        sendSmtpEmail.sender = {
          name: 'Water Blob® Website',
          email: process.env.BREVO_FROM_EMAIL || 'noreply@waterblob.com',
        };
        sendSmtpEmail.to = contactEmail.split(',').map((e: string) => ({ email: e.trim() }));
        sendSmtpEmail.replyTo = { email, name };
        sendSmtpEmail.htmlContent = `
          <h2>New Product Inquiry</h2>
          <hr/>
          <h3>Customer Information</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          ${message ? `<p><strong>Message:</strong></p><p>${message}</p>` : ''}
          <hr/>
          <h3>Product Details</h3>
          <p><strong>Product:</strong> ${productName}</p>
          ${productSize ? `<p><strong>Size:</strong> ${productSize}</p>` : ''}
          <p><strong>Price:</strong> $${Number(productPrice).toFixed(2)}</p>
          <p><strong>Quantity:</strong> ${quantity || 1}</p>
          ${customizationHtml}
          <hr/>
          <p style="color: #888; font-size: 12px;">Sent from the Water Blob® website product inquiry form.</p>
        `;
        await brevoClient.sendTransacEmail(sendSmtpEmail);
      } catch {
        // Email send failed silently
      }
    }

    return NextResponse.json({ success: true, message: 'Thank you! We will be in touch shortly.' });
  } catch {
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}
