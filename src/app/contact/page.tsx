'use client';

import { useState, useRef, FormEvent } from 'react';
import Link from 'next/link';
import styles from './contact.module.css';

const FAQ_ITEMS = [
  {
    question: 'How do I get a quote for a Water Blob?',
    answer:
      'Simply fill out the contact form above with "Request a Quote" selected as the subject, or call us directly at (417) 864-8461. Let us know the size you are interested in, where it will be used, and any other details. We typically respond to quote requests within one business day.',
  },
  {
    question: 'What is the typical lead time for orders?',
    answer:
      'Standard orders usually ship within 2-4 weeks depending on the product and current demand. Custom orders and large commercial orders may take 4-6 weeks. During our busy season (March through May), lead times may be slightly longer. Contact us for the most up-to-date availability.',
  },
  {
    question: 'Do you offer repair services?',
    answer:
      'Yes! We offer professional repair services for Water Blobs and other inflatables. Whether it is a seam issue, valve replacement, or patching, our team can handle it. Ship your product to our Springfield, MO facility and we will provide a repair estimate before any work begins.',
  },
  {
    question: 'What does the warranty cover?',
    answer:
      'Our Water Blobs come with a manufacturer warranty covering defects in materials and workmanship. Warranty length varies by product, so please refer to your product documentation or contact us with your order details. Normal wear and tear, misuse, and damage from improper inflation are not covered.',
  },
  {
    question: 'Do you ship internationally?',
    answer:
      'Yes, we ship to many international destinations. International shipping rates and delivery times vary by location. Please contact us with your shipping address and desired products, and we will provide a detailed shipping quote including any applicable customs or duties information.',
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const formLoadedAt = useRef(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          _hp: honeypot,
          _t: formLoadedAt.current,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      setSuccess(data.message || 'Thank you for your message! We will get back to you shortly.');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  function toggleFaq(index: number) {
    setOpenFaq((prev) => (prev === index ? null : index));
  }

  return (
    <main>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.heroTitle}>
            Get in <span className="gradient-text">Touch</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Have a question, need a quote, or want to learn more about our products?
            We would love to hear from you.
          </p>
        </div>
      </section>

      {/* ── Contact Content ── */}
      <section className={styles.content}>
        <div className="container">
          <div className={styles.grid}>
            {/* Left column - Contact Info */}
            <div className={styles.infoColumn}>
              {/* Email */}
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 4L12 13 2 4" />
                  </svg>
                </div>
                <div>
                  <div className={styles.infoLabel}>Email</div>
                  <div className={styles.infoValue}>
                    <a href="mailto:lorie@thewaterblob.com">lorie@thewaterblob.com</a>
                  </div>
                  <div className={styles.infoSubtext}>
                    We typically respond within one business day
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                  </svg>
                </div>
                <div>
                  <div className={styles.infoLabel}>Phone</div>
                  <div className={styles.infoValue}>
                    <a href="tel:+14178648461">(417) 864-8461</a>
                  </div>
                  <div className={styles.infoSubtext}>
                    Available during business hours
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <div className={styles.infoLabel}>Location</div>
                  <div className={styles.infoValue}>
                    2045 N. National Ave<br />
                    Springfield, MO
                  </div>
                  <div className={styles.infoSubtext}>
                    Manufacturing and customer service
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className={styles.hoursCard}>
                <div className={styles.hoursHeader}>
                  <div className={styles.hoursIcon}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className={styles.hoursTitle}>Business Hours</div>
                </div>
                <ul className={styles.hoursList}>
                  <li className={styles.hoursRow}>
                    <span className={styles.hoursDay}>Mon - Fri</span>
                    <span className={styles.hoursTime}>8:00 AM - 4:30 PM CST</span>
                  </li>
                  <li className={styles.hoursRow}>
                    <span className={styles.hoursDay}>Saturday</span>
                    <span className={`${styles.hoursTime} ${styles.hoursClosed}`}>Closed</span>
                  </li>
                  <li className={styles.hoursRow}>
                    <span className={styles.hoursDay}>Sunday</span>
                    <span className={`${styles.hoursTime} ${styles.hoursClosed}`}>Closed</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right column - Form */}
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Send Us a Message</h2>
              <p className={styles.formSubtitle}>
                Fill out the form below and we will get back to you as soon as possible.
              </p>

              {success && (
                <div className={styles.successMessage} role="status">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  {success}
                </div>
              )}

              {error && (
                <div className={styles.errorMessage} role="alert">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* First + Last Name */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="firstName" className={styles.formLabel}>
                      First Name<span className={styles.required}>*</span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      className={styles.formInput}
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="lastName" className={styles.formLabel}>
                      Last Name<span className={styles.required}>*</span>
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      className={styles.formInput}
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.formLabel}>
                    Email<span className={styles.required}>*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={styles.formInput}
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Phone */}
                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.formLabel}>
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className={styles.formInput}
                    placeholder="(555) 555-5555"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                {/* Subject */}
                <div className={styles.formGroup}>
                  <label htmlFor="subject" className={styles.formLabel}>
                    Subject<span className={styles.required}>*</span>
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className={styles.formSelect}
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select a subject...
                    </option>
                    <option value="general">General Inquiry</option>
                    <option value="quote">Request a Quote</option>
                    <option value="custom">Custom Order</option>
                    <option value="support">Product Support</option>
                    <option value="warranty">Warranty Question</option>
                    <option value="shipping">Shipping Question</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Message */}
                <div className={styles.formGroup}>
                  <label htmlFor="message" className={styles.formLabel}>
                    Message<span className={styles.required}>*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    className={styles.formTextarea}
                    placeholder="Tell us how we can help..."
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Honeypot — hidden from real users */}
                <div className="hp-field" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.faq}>
        <div className="container">
          <div className={styles.faqHeader}>
            <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
            <p className={styles.faqSubtitle}>
              Quick answers to common questions. Need more help?
              Give us a call or send a message above.
            </p>
          </div>

          <div className={styles.faqList}>
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} className={styles.faqItem}>
                <button
                  className={styles.faqQuestion}
                  onClick={() => toggleFaq(index)}
                  aria-expanded={openFaq === index}
                >
                  {item.question}
                  <svg
                    className={`${styles.faqChevron} ${openFaq === index ? styles.faqChevronOpen : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                <div
                  className={`${styles.faqAnswer} ${openFaq === index ? styles.faqAnswerOpen : ''}`}
                >
                  <div className={styles.faqAnswerInner}>{item.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <div className="container">
          <h2 className={styles.ctaTitle}>
            Ready to Make a <span className="gradient-text">Splash</span>?
          </h2>
          <p className={styles.ctaText}>
            Explore our full lineup of commercial Water Blobs, water slides, and lake
            inflatables built to last.
          </p>
          <Link href="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      </section>
    </main>
  );
}
