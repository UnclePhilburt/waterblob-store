'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const HERO_IMAGES = [
  { src: '/images/homepage4.jpg', alt: 'Person launched high in the air from a Water Blob' },
  { src: '/images/homepage7.jpg', alt: 'Classic Water Blob launch on a lake' },
  { src: '/images/homepage5.jpg', alt: 'Kid doing a flip over a Water Blob' },
  { src: '/images/homepage1.jpg', alt: 'Two people jumping onto a Water Blob' },
  { src: '/images/homepage3.jpg', alt: 'Kids having fun on a Water Blob' },
];

/* ------------------------------------------------------------------ */
/*  Photo Database                                                     */
/* ------------------------------------------------------------------ */
const PHOTO_DB: Record<string, { src: string; alt: string }[]> = {
  blob: [
    { src: '/assets/homepage/blob/oceanblobjump.webp', alt: 'Ocean Water Blob jump' },
    { src: '/assets/homepage/blob/blobtallbounce.webp', alt: 'Tall bounce on Water Blob' },
    { src: '/assets/homepage/blob/buffguyblob.webp', alt: 'Person on Water Blob' },
    { src: '/assets/homepage/blob/Blob_thumbs_up (1).webp', alt: 'Thumbs up on Water Blob' },
    { src: '/assets/homepage/blob/blobbouncelifejacket.webp', alt: 'Water Blob bounce with life jacket' },
    { src: '/assets/homepage/blob/466791627_958475059640030_507989288299889840_n (1).webp', alt: 'Water Blob fun' },
    { src: '/assets/homepage/blob/Crushed Blob.webp', alt: 'Water Blob moment' },
    { src: '/assets/homepage/blob/costaricablob.webp', alt: 'Water Blob in Costa Rica' },
  ],
  waterslide: [
    { src: '/assets/homepage/waterslide/waterslidearmsup.webp', alt: 'Water slide arms up' },
    { src: '/assets/homepage/waterslide/waterslide.webp', alt: 'Water slide action' },
  ],
  skitube: [
    { src: '/assets/homepage/skitube/skitube1.webp', alt: 'Ski tube adventure' },
    { src: '/assets/homepage/skitube/tubing.webp', alt: 'Tubing fun' },
    { src: '/assets/homepage/skitube/tube2.webp', alt: 'Ski tube ride' },
    { src: '/assets/homepage/skitube/tube2 (1).webp', alt: 'Ski tube excitement' },
    { src: '/assets/homepage/skitube/Ski-Tube-Blue.webp', alt: 'Blue Ski Tube' },
    { src: '/assets/homepage/skitube/Ski-Tube-Yellow.webp', alt: 'Yellow Ski Tube' },
    { src: '/assets/homepage/skitube/449285104_861688899318647_4598670258531989843_n_2ef70b80-2f85-4a7d-9c5e-d875335c6934.webp', alt: 'Ski tube on lake' },
    { src: '/assets/homepage/skitube/456650302_898725932281610_5382758167146378589_n_7d45e8d6-e483-41de-bc77-da84f6b04f37.webp', alt: 'Ski tube action shot' },
    { src: '/assets/homepage/skitube/456671048_898725828948287_8699036171179732895_n_80d04f86-6f55-4624-8018-555e49791659.webp', alt: 'Ski tube water sports' },
    { src: '/assets/homepage/skitube/463083031_936542691833267_422361865483044909_n_20a7ceae-bf50-42b8-82b0-ac514ce45fb5.webp', alt: 'Ski tube splash' },
  ],
};

/* ------------------------------------------------------------------ */
/*  Media "As Seen In" Data                                            */
/* ------------------------------------------------------------------ */
const MEDIA_ITEMS = [
  { title: 'Jackass 3D', year: '2010', type: 'Film' },
  { title: 'Pitch Perfect 2', year: '2015', type: 'Film' },
  { title: 'Piranha 3D', year: '2010', type: 'Film' },
  { title: 'Heavyweights', year: '1995', type: 'Film' },
  { title: 'Twisted Tea', year: 'TV', type: 'Commercial' },
  { title: 'Southbound', year: 'Music Video', type: 'Carrie Underwood' },
];

/* ------------------------------------------------------------------ */
/*  Video Data                                                         */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/*  Shuffle utility                                                    */
/* ------------------------------------------------------------------ */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ================================================================== */
/*  HOMEPAGE COMPONENT                                                 */
/* ================================================================== */
export default function Home() {
  /* ---- Hero Image (random, stable per session) ---- */
  const [heroImage, setHeroImage] = useState(HERO_IMAGES[0]);
  useEffect(() => {
    setHeroImage(HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)]);
  }, []);

  /* ---- Photo Gallery ---- */
  const galleryPhotos = useMemo(() => {
    const all = Object.entries(PHOTO_DB).flatMap(([cat, photos]) =>
      photos.map((p) => ({ ...p, category: cat }))
    );
    // Stable interleaved pick: take from each category in round-robin order
    const byCat = Object.entries(PHOTO_DB).map(([cat, photos]) =>
      photos.map((p) => ({ ...p, category: cat }))
    );
    const result: typeof all = [];
    let i = 0;
    while (result.length < 9) {
      for (const cat of byCat) {
        if (i < cat.length && result.length < 9) result.push(cat[i]);
      }
      i++;
    }
    return result;
  }, []);

  const [modalPhoto, setModalPhoto] = useState<{ src: string; alt: string } | null>(null);

  /* ---- Quote Panel ---- */
  const [quotePanelOpen, setQuotePanelOpen] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    email: '',
    phone: '',
    orgType: '',
    productInterest: '',
    message: '',
  });
  const [quoteHoneypot, setQuoteHoneypot] = useState('');
  const [quoteHp2, setQuoteHp2] = useState('');
  const [quoteHp3, setQuoteHp3] = useState('');
  const quoteLoadedAt = useRef(Date.now());
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  const openQuotePanel = () => setQuotePanelOpen(true);
  const closeQuotePanel = () => setQuotePanelOpen(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeQuotePanel();
        if (modalPhoto) setModalPhoto(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [modalPhoto]);

  const handleQuoteChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setQuoteForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSubmitting(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quoteForm.name,
          email: quoteForm.email,
          phone: quoteForm.phone,
          organization_type: quoteForm.orgType,
          product_interest: quoteForm.productInterest,
          message: quoteForm.message,
          source: 'quote_panel',
          _hp: quoteHoneypot,
          _hp2: quoteHp2,
          _hp3: quoteHp3,
          _t: quoteLoadedAt.current,
        }),
      });
      setQuoteSuccess(true);
    } catch {
      // silent fail -- user sees no change
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const resetQuoteForm = () => {
    setQuoteForm({ name: '', email: '', phone: '', orgType: '', productInterest: '', message: '' });
    setQuoteHoneypot('');
    quoteLoadedAt.current = Date.now();
    setQuoteSuccess(false);
  };

  /* ---- Scroll Animations ---- */
  useEffect(() => {
    const sections = document.querySelectorAll(
      '.stats, .photo-gallery, .media-section, .features, .video-section, .cta'
    );
    const items = document.querySelectorAll(
      '.stat, .photo-item, .video-card, .feature-card'
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const itemObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('slide-up');
            itemObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    sections.forEach((s) => observer.observe(s));
    items.forEach((s) => itemObserver.observe(s));

    return () => {
      observer.disconnect();
      itemObserver.disconnect();
    };
  }, []);

  /* ---- Scroll Progress Bar ---- */
  useEffect(() => {
    const progressBar = document.getElementById('scroll-progress');
    if (!progressBar) return;
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = `${pct}%`;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ---- Feature card glow tracking ---- */
  useEffect(() => {
    const cards = document.querySelectorAll('.feature-card');
    const handlers: Array<{ el: Element; handler: (e: Event) => void }> = [];
    cards.forEach((card) => {
      const handler = (e: Event) => {
        const me = e as MouseEvent;
        const rect = (card as HTMLElement).getBoundingClientRect();
        const x = ((me.clientX - rect.left) / rect.width) * 100;
        const y = ((me.clientY - rect.top) / rect.height) * 100;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}%`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}%`);
      };
      card.addEventListener('mousemove', handler);
      handlers.push({ el: card, handler });
    });
    return () => {
      handlers.forEach(({ el, handler }) => el.removeEventListener('mousemove', handler));
    };
  }, []);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <>
      {/* Scroll Progress Bar */}
      <div id="scroll-progress" className="scroll-progress" />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                name: 'Water Blob',
                url: 'https://thewaterblob.com',
                logo: 'https://thewaterblob.com/assets/homepage/logo.png',
                description:
                  'The original Water Blob since 1984. Commercial-grade inflatable water launchers trusted by camps worldwide.',
                foundingDate: '1984',
                sameAs: [
                  'https://www.facebook.com/thewaterblob',
                  'https://www.instagram.com/thewaterblob',
                  'https://www.youtube.com/@thewaterblob',
                ],
              },
              {
                '@type': 'WebSite',
                url: 'https://thewaterblob.com',
                name: 'Water Blob',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: 'https://thewaterblob.com/products?q={search_term_string}',
                  'query-input': 'required name=search_term_string',
                },
              },
              {
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'What is a Water Blob?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'A Water Blob is an inflatable water launcher that sits on the surface of a lake. One person sits on the launch end while another jumps onto the opposite end, launching the first person into the air for an exciting water landing.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'How long does a Water Blob last?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'With proper care, a commercial-grade Water Blob can last 10+ years. Our products use UV-resistant, reinforced vinyl built for heavy daily use at summer camps and resorts.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Is the Water Blob safe?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. Our Water Blobs are designed with safety as a top priority, featuring reinforced seams, commercial-grade materials, and decades of engineering expertise. We recommend following all safety guidelines and having trained supervision.',
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />

      <main>
        {/* ============================================================ */}
        {/* HERO SECTION                                                  */}
        {/* ============================================================ */}
        <section className="hero">
          <div className="hero-image-wrapper">
            <Image
              src={heroImage.src}
              alt={heroImage.alt}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover' }}
            />
            <div className="hero-image-overlay" />
          </div>

          <div className="hero-content">
            <div className="container">
              <Link href="/products" className="sale-banner" aria-label="Shop Water Blobs at 15% off">
                <span className="sale-banner-badge">15% OFF</span>
                <span className="sale-banner-text">
                  Water Blobs <span aria-hidden="true">•</span> Limited Time
                </span>
                <span className="sale-banner-arrow" aria-hidden="true">→</span>
              </Link>
              <h1>The Leap That Changes <span className="hero-accent">Everything</span></h1>
              <p className="hero-tagline">
                Since 1984, the Water Blob&reg; has turned nervous campers into the bravest kids on the lake.
              </p>
              <div className="hero-actions">
                <Link href="/products" className="btn btn-primary">
                  Shop Water Blobs
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile scroll safe zone */}
          <div className="scroll-safe-zone">
            <div className="scroll-indicator">
              <span className="scroll-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
              <span className="scroll-text">Scroll Down</span>
            </div>
          </div>

        </section>

        {/* ============================================================ */}
        {/* STATS SECTION                                                 */}
        {/* ============================================================ */}
        <section className="stats">
          <div className="container">
            <div className="stats-grid">
              <div className="stat">
                <h3>40+</h3>
                <p>Years of Excellence</p>
              </div>
              <div className="stat">
                <h3>500+</h3>
                <p>Camps Served</p>
              </div>
              <div className="stat">
                <h3>1M+</h3>
                <p>Moments of Joy</p>
              </div>
              <div className="stat">
                <h3>Countless</h3>
                <p>Memories Made</p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* PHOTO GALLERY                                                 */}
        {/* ============================================================ */}
        <section className="photo-gallery">
          <div className="container">
            <h2>Captured in Action</h2>
            <p className="subtitle">
              Real moments of joy from camps and lakes around the world.
            </p>
            <div className="photo-grid">
              {galleryPhotos.map((photo, i) => (
                <div
                  key={`${photo.src}-${i}`}
                  className="photo-item"
                  onClick={() => setModalPhoto(photo)}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={400}
                    height={300}
                  />
                  <span className="photo-category">{photo.category}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Photo Modal */}
        {modalPhoto && (
          <div
            className={`photo-modal ${modalPhoto ? 'active' : ''}`}
            onClick={() => setModalPhoto(null)}
          >
            <div className="photo-modal-overlay" onClick={(e) => e.stopPropagation()}>
              <button
                className="photo-modal-close"
                onClick={() => setModalPhoto(null)}
                aria-label="Close photo"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <Image src={modalPhoto.src} alt={modalPhoto.alt} width={1200} height={800} style={{ width: '100%', height: 'auto' }} />
              <div className="photo-modal-caption">{modalPhoto.alt}</div>
            </div>
          </div>
        )}

        {/* As Seen In — compact single line */}
        <div className="as-seen-in-bar">
          <span>As seen in:</span>
          {MEDIA_ITEMS.map((item) => (
            <span key={item.title} className="as-seen-in-item">{item.title}</span>
          ))}
        </div>

        {/* ============================================================ */}
        {/* CTA SECTION                                                   */}
        {/* ============================================================ */}
        <section className="cta">
          <div className="container">
            <h2>Build More Than a Camp Activity--Build Character</h2>
            <p>
              Every launch on the Water Blob is a lesson in courage. Give your campers
              an experience they will talk about for the rest of their lives.
            </p>
            <Link href="/products" className="btn btn-primary">
              Shop Commercial Water Blob&reg;s
            </Link>
          </div>
        </section>
      </main>

      {/* ============================================================== */}
      {/* QUOTE SIDEBAR PANEL                                             */}
      {/* ============================================================== */}

      {/* Tab on left edge */}
      <div
        className={`quote-sidebar-tab ${quotePanelOpen ? 'active' : ''}`}
        onClick={openQuotePanel}
      >
        <span className="quote-tab-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </span>
        <span className="quote-tab-text">Get a Quote</span>
      </div>

      {/* Overlay */}
      <div
        className={`quote-panel-overlay ${quotePanelOpen ? 'active' : ''}`}
        onClick={closeQuotePanel}
      />

      {/* Panel */}
      <div className={`quote-panel ${quotePanelOpen ? 'active' : ''}`}>
        <button
          className="quote-panel-close"
          onClick={closeQuotePanel}
          aria-label="Close quote panel"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="quote-panel-content">
          <div className="quote-panel-header">
            <h3>Request a Quote</h3>
            <p>Tell us about your needs and we will get back to you quickly.</p>
          </div>

          {!quoteSuccess ? (
            <form className="quote-form" onSubmit={handleQuoteSubmit}>
              <div className="quote-form-group">
                <label htmlFor="quote-name">Name</label>
                <input
                  id="quote-name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  value={quoteForm.name}
                  onChange={handleQuoteChange}
                  required
                />
              </div>
              <div className="quote-form-group">
                <label htmlFor="quote-email">Email</label>
                <input
                  id="quote-email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={quoteForm.email}
                  onChange={handleQuoteChange}
                  required
                />
              </div>
              <div className="quote-form-group">
                <label htmlFor="quote-phone">Phone</label>
                <input
                  id="quote-phone"
                  name="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={quoteForm.phone}
                  onChange={handleQuoteChange}
                />
              </div>
              <div className="quote-form-group">
                <label htmlFor="quote-org">Organization Type</label>
                <select
                  id="quote-org"
                  name="orgType"
                  value={quoteForm.orgType}
                  onChange={handleQuoteChange}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="summer-camp">Summer Camp</option>
                  <option value="resort">Resort / Hotel</option>
                  <option value="waterpark">Waterpark</option>
                  <option value="rental">Rental Company</option>
                  <option value="personal">Personal / Family</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="quote-form-group">
                <label htmlFor="quote-product">Product Interest</label>
                <select
                  id="quote-product"
                  name="productInterest"
                  value={quoteForm.productInterest}
                  onChange={handleQuoteChange}
                  required
                >
                  <option value="">Select product...</option>
                  <option value="water-blob">Water Blob</option>
                  <option value="waterslide">Water Slide</option>
                  <option value="ski-tube">Ski Tube</option>
                  <option value="multiple">Multiple Products</option>
                  <option value="custom">Custom Order</option>
                </select>
              </div>
              <div className="quote-form-group">
                <label htmlFor="quote-message">Message</label>
                <textarea
                  id="quote-message"
                  name="message"
                  placeholder="Tell us about your needs, quantity, timeline..."
                  rows={4}
                  value={quoteForm.message}
                  onChange={handleQuoteChange}
                />
              </div>
              {/* Honeypot fields — hidden from real users, bots fill these */}
              <div className="hp-field" aria-hidden="true">
                <label htmlFor="quote-website">Website</label>
                <input id="quote-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={quoteHoneypot} onChange={(e) => setQuoteHoneypot(e.target.value)} />
                <label htmlFor="quote-company">Company</label>
                <input id="quote-company" name="company" type="text" tabIndex={-1} autoComplete="off" value={quoteHp2} onChange={(e) => setQuoteHp2(e.target.value)} />
                <label htmlFor="quote-url">URL</label>
                <input id="quote-url" name="url" type="url" tabIndex={-1} autoComplete="off" value={quoteHp3} onChange={(e) => setQuoteHp3(e.target.value)} />
              </div>

              <button
                type="submit"
                className="quote-submit-btn"
                disabled={quoteSubmitting}
              >
                {quoteSubmitting ? (
                  <>
                    <svg className="quote-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" opacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Send Quote Request'
                )}
              </button>

              <div className="quote-panel-footer">
                <p>
                  Or call us directly:{' '}
                  <a href="tel:+14178648461">(417) 864-8461</a>
                </p>
              </div>
            </form>
          ) : (
            <div className="quote-success">
              <div className="quote-success-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h4>Quote Request Sent!</h4>
              <p>
                Thank you for your interest. Our team will review your request and
                get back to you within 24 hours.
              </p>
              <button className="quote-another-btn" onClick={resetQuoteForm}>
                Submit Another Request
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
