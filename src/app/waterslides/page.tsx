'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './waterslides.module.css';

/* ==========================================================================
   Static data
   ========================================================================== */

const GALLERY_PHOTOS = [
  {
    src: '/assets/homepage/waterslide/461103194_919714816849388_211587571729775777_n_c91e2b93-1ff5-43a5-a3cd-0b5ba0fb904f.webp',
    alt: 'Making Memories',
  },
  {
    src: '/assets/homepage/waterslide/195710065_4271547202883402_4372633433637154885_n_772348e1-361e-4a39-8cb1-e53af57d522d.webp',
    alt: 'Thrills for Everyone',
  },
  {
    src: '/assets/homepage/waterslide/467978958_10161135822889965_5649361251702952556_n.webp',
    alt: 'The Ultimate Splash',
  },
  {
    src: '/assets/homepage/waterslide/waterslidearmsup.webp',
    alt: 'Pure Summer Excitement',
  },
  {
    src: '/assets/homepage/waterslide/waterslide.webp',
    alt: 'Perfect Dock Integration',
  },
  {
    src: '/assets/homepage/waterslide/Slide-1.webp',
    alt: 'Premium Quality',
  },
  {
    src: '/assets/homepage/waterslide/476322513_1020855253402010_122618039604313359_n.webp',
    alt: 'Endless Summer Fun',
  },
];

/* ---------- Fisher-Yates shuffle ---------- */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/* ==========================================================================
   Waterslides Page Component
   ========================================================================== */

export default function WaterslidesPage() {
  const shuffledPhotos = useMemo(() => shuffleArray(GALLERY_PHOTOS), []);

  return (
    <main>
      {/* -------- Hero -------- */}
      <section className={styles.slideHero}>
        <Image
          className={styles.slideHeroBg}
          src="/assets/homepage/waterslide/waterslidearmsup.webp"
          alt="Water slide action shot"
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.slideHeroContent}>
          <h1>Water Slides</h1>
          <p>
            Custom built to fit your dock, your hill, your lake. Any size, any
            location.
          </p>
          <Link href="/waterslide-quote" className={styles.quoteBtn}>
            Request a Quote
          </Link>
        </div>
      </section>

      {/* -------- Feature Blocks (first pair) -------- */}
      <div className={styles.slideFeatures}>
        <div className={styles.featureBlock}>
          <div className={styles.featureMedia}>
            <Image
              src="/assets/homepage/waterslide/waterslide.webp"
              alt="Commercial grade water slide construction"
              width={600}
              height={380}
            />
          </div>
          <div className={styles.featureText}>
            <h2>Commercial Grade Construction</h2>
            <p>
              Every water slide we build is made with the same heavy-duty,
              commercial-grade materials trusted by camps, resorts, and
              waterparks worldwide. Reinforced seams, UV-resistant vinyl, and
              industrial stitching ensure your slide stands up to years of
              heavy use — season after season.
            </p>
          </div>
        </div>

        <div className={`${styles.featureBlock} ${styles.reverse}`}>
          <div className={styles.featureMedia}>
            <Image
              src="/assets/homepage/waterslide/476322513_1020855253402010_122618039604313359_n.webp"
              alt="The highlight of every summer"
              width={600}
              height={380}
            />
          </div>
          <div className={styles.featureText}>
            <h2>The Highlight of Every Summer</h2>
            <p>
              There is nothing quite like the rush of a water slide on a hot
              summer day. Our slides become the centerpiece of lake days,
              family gatherings, and camp activities — the one thing everyone
              talks about long after the season ends.
            </p>
          </div>
        </div>
      </div>

      {/* -------- Statement -------- */}
      <div className={styles.slideStatement}>
        <p>
          40+ years of experience.{' '}
          <span className={styles.muted}>One commitment to quality.</span>
        </p>
      </div>

      {/* -------- Full-Width Break Image -------- */}
      <div className={styles.fullImage}>
        <Image
          src="/assets/homepage/waterslide/Slide-1.webp"
          alt="Water slide panoramic view"
          width={1100}
          height={440}
        />
      </div>

      {/* -------- Feature Blocks (second pair) -------- */}
      <div className={styles.slideFeatures}>
        <div className={styles.featureBlock}>
          <div className={styles.featureMedia}>
            <Image
              src="/assets/homepage/waterslide/467814556_10161135823759965_476855514491060702_n.webp"
              alt="Make every lake day unforgettable"
              width={600}
              height={380}
            />
          </div>
          <div className={styles.featureText}>
            <h2>Make Every Lake Day Unforgettable</h2>
            <p>
              Whether it is a private dock on a quiet lake or a bustling summer
              camp waterfront, our slides transform any shoreline into a
              destination. Custom sizing means a perfect fit for your specific
              setup — no compromises.
            </p>
          </div>
        </div>

        <div className={`${styles.featureBlock} ${styles.reverse}`}>
          <div className={styles.featureMedia}>
            <Image
              src="/assets/homepage/waterslide/Slide-5_36719e66-87b6-46d9-9b2c-babc4de2e189.webp"
              alt="Your colors, your design"
              width={600}
              height={380}
            />
          </div>
          <div className={styles.featureText}>
            <h2>Your Colors, Your Design</h2>
            <p>
              Choose from a wide range of colors and configurations to match
              your brand, your property, or your personality. Every slide is
              manufactured to order, so you get exactly what you envision —
              down to the last detail.
            </p>
          </div>
        </div>
      </div>

      {/* -------- Gallery Strip -------- */}
      <div className={styles.galleryStrip}>
        {shuffledPhotos.map((photo) => (
          <div key={photo.src} className={styles.galleryStripItem}>
            <Image src={photo.src} alt={photo.alt} fill style={{ objectFit: 'cover' }} sizes="340px" />
          </div>
        ))}
      </div>

      {/* -------- Closing CTA -------- */}
      <div className={styles.closingCta}>
        <h2>Ready to get started?</h2>
        <p>
          Every water slide is custom manufactured to your exact
          specifications. Tell us about your setup and we will design the
          perfect slide for your property — no obligation, no pressure.
        </p>
        <Link
          href="/waterslide-quote"
          className={`${styles.quoteBtn} ${styles.quoteBtnDark}`}
        >
          Request a Quote
        </Link>
      </div>

      {/* -------- Bottom CTA -------- */}
      <section className={styles.bottomCta}>
        <p>Need Help?</p>
        <Link href="/contact">Get in touch with our team</Link>
      </section>
    </main>
  );
}
