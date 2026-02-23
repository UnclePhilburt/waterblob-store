'use client';

import { useState, useRef, FormEvent } from 'react';
import Link from 'next/link';
import styles from './waterslide-quote.module.css';

interface QuoteFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  organization: string;
  locationType: string;
  timeline: string;
  slideLength: string;
  slideWidth: string;
  waterDepth: string;
  message: string;
  howHeard: string;
}

const INITIAL_FORM_DATA: QuoteFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  organization: '',
  locationType: '',
  timeline: '',
  slideLength: '',
  slideWidth: '',
  waterDepth: '',
  message: '',
  howHeard: '',
};

export default function WaterslideQuotePage() {
  const [formData, setFormData] = useState<QuoteFormData>(INITIAL_FORM_DATA);
  const [honeypot, setHoneypot] = useState('');
  const formLoadedAt = useRef(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/quote-request', {
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

      setFormMessage({
        type: 'success',
        text:
          data.message ||
          'Thank you for your quote request! We will get back to you within 1-2 business days.',
      });
      setFormData(INITIAL_FORM_DATA);
    } catch (err) {
      const fallback =
        'Something went wrong. Please try again or email us directly at lorie@thewaterblob.com.';
      setFormMessage({
        type: 'error',
        text: err instanceof Error ? err.message : fallback,
      });
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }

  return (
    <main>
      {/* Hero */}
      <section className={styles.quoteHero}>
        <div className={styles.quoteHeroContent}>
          <h1>
            Get a <span className={styles.heroAccent}>Custom Quote</span>
          </h1>
          <p>
            Tell us about your project and we'll create a personalized quote for
            your water slide.
          </p>
        </div>
      </section>

      {/* Quote Section */}
      <section className={styles.quoteSection}>
        <div className={styles.quoteContainer}>
          {/* Back Link */}
          <Link href="/waterslides" className={styles.backLink}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Water Slides
          </Link>

          {/* Quote Card */}
          <div className={styles.quoteCard}>
            <h2 className={styles.quoteCardTitle}>Request a Quote</h2>
            <p className={styles.quoteCardSubtitle}>
              Fill out the form below and we'll get back to you within 1-2
              business days.
            </p>

            {/* Form Message */}
            <div
              ref={messageRef}
              className={`${styles.formMessage} ${
                formMessage ? styles.formMessageVisible : ''
              } ${formMessage?.type === 'success' ? styles.success : ''} ${
                formMessage?.type === 'error' ? styles.error : ''
              }`}
              role={formMessage?.type === 'error' ? 'alert' : 'status'}
            >
              {formMessage?.text}
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Contact Information */}
              <div className={styles.formSection}>
                <h3>Contact Information</h3>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="firstName">
                      First Name<span className={styles.required}>*</span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="lastName">
                      Last Name<span className={styles.required}>*</span>
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">
                    Email<span className={styles.required}>*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Phone</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(555) 555-5555"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="organization">Organization</label>
                    <input
                      id="organization"
                      name="organization"
                      type="text"
                      placeholder="Camp, resort, etc."
                      value={formData.organization}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className={styles.formSection}>
                <h3>Project Details</h3>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="locationType">
                      Location Type<span className={styles.required}>*</span>
                    </label>
                    <select
                      id="locationType"
                      name="locationType"
                      value={formData.locationType}
                      onChange={handleChange}
                      required
                    >
                      <option value="" disabled>
                        Select location type...
                      </option>
                      <option value="Summer Camp">Summer Camp</option>
                      <option value="Resort/Hotel">Resort/Hotel</option>
                      <option value="Water Park">Water Park</option>
                      <option value="Private Lake/Pond">Private Lake/Pond</option>
                      <option value="Municipal/Public Beach">
                        Municipal/Public Beach
                      </option>
                      <option value="Military Base">Military Base</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="timeline">Timeline</label>
                    <select
                      id="timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                    >
                      <option value="" disabled>
                        Select timeline...
                      </option>
                      <option value="ASAP">ASAP</option>
                      <option value="1-3 Months">1-3 Months</option>
                      <option value="3-6 Months">3-6 Months</option>
                      <option value="6-12 Months">6-12 Months</option>
                      <option value="Just Exploring">Just Exploring</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="slideLength">Slide Length</label>
                    <input
                      id="slideLength"
                      name="slideLength"
                      type="text"
                      placeholder='e.g. 20 ft'
                      value={formData.slideLength}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="slideWidth">Slide Width</label>
                    <input
                      id="slideWidth"
                      name="slideWidth"
                      type="text"
                      placeholder='e.g. 6 ft'
                      value={formData.slideWidth}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="waterDepth">Water Depth</label>
                  <input
                    id="waterDepth"
                    name="waterDepth"
                    type="text"
                    placeholder='e.g. 8 ft'
                    value={formData.waterDepth}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className={styles.formSection}>
                <h3>Additional Information</h3>

                <div className={styles.formGroup}>
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Tell us more about your project, special requirements, or any questions you have..."
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="howHeard">How did you hear about us?</label>
                  <select
                    id="howHeard"
                    name="howHeard"
                    value={formData.howHeard}
                    onChange={handleChange}
                  >
                    <option value="" disabled>
                      Select an option...
                    </option>
                    <option value="Search Engine">Search Engine</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Referral">Referral</option>
                    <option value="Trade Show">Trade Show</option>
                    <option value="Returning Customer">Returning Customer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
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
                {submitting ? 'Submitting...' : 'Submit Quote Request'}
              </button>
            </form>
          </div>

          {/* Info Cards */}
          <div className={styles.infoCards}>
            <div className={styles.infoCard}>
              <div className={styles.infoCardIcon}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.infoCardTitle}>Quick Response</div>
              <div className={styles.infoCardText}>
                We respond to all quote requests within 1-2 business days.
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoCardIcon}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <div className={styles.infoCardTitle}>Custom Design</div>
              <div className={styles.infoCardText}>
                Every water slide is custom built to fit your specific location.
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoCardIcon}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <div className={styles.infoCardTitle}>Free Consultation</div>
              <div className={styles.infoCardText}>
                Talk with our team to find the perfect slide for your needs.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
