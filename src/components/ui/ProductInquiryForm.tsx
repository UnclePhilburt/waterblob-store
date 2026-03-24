'use client';

import { useState, useRef, FormEvent } from 'react';
import styles from './ProductInquiryForm.module.css';

interface ProductInquiryFormProps {
  productName: string;
  productPrice: number;
  productSize?: string;
  quantity: number;
  productImage?: string;
  getCustomization?: () => string | null;
  getCustomImage?: () => string | null;
}

export default function ProductInquiryForm({
  productName,
  productPrice,
  productSize,
  quantity,
  productImage,
  getCustomization,
  getCustomImage,
}: ProductInquiryFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const timestampRef = useRef(Date.now());

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    // Capture customization and screenshot at submit time
    const customization = getCustomization?.() || undefined;
    const customImage = getCustomImage?.() || undefined;

    try {
      const res = await fetch('/api/product-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          message: message || undefined,
          productName,
          productPrice,
          productSize,
          quantity,
          productImage: productImage || undefined,
          customization,
          customImage,
          _t: timestampRef.current,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult({ success: true, message: data.message || 'Thank you! We will be in touch shortly.' });
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        setResult({ success: false, message: data.error || 'Something went wrong. Please try again.' });
      }
    } catch {
      setResult({ success: false, message: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.inquiryForm} onSubmit={handleSubmit}>
      <h3>Inquire About This Product</h3>

      {result && (
        <div className={result.success ? styles.success : styles.error}>
          {result.message}
        </div>
      )}

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label htmlFor="inquiry-name">Name *</label>
          <input
            id="inquiry-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="inquiry-email">Email *</label>
          <input
            id="inquiry-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="inquiry-phone">Phone *</label>
        <input
          id="inquiry-phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 555-5555"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="inquiry-message">Message (optional)</label>
        <textarea
          id="inquiry-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Any questions or special requests..."
          rows={3}
        />
      </div>

      {/* Honeypot */}
      <div className={styles.honeypot} aria-hidden="true">
        <input type="text" name="_hp" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" className={styles.submitBtn} disabled={submitting}>
        {submitting ? 'Sending...' : 'Send Inquiry'}
      </button>
    </form>
  );
}
