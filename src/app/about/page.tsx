'use client';

import { useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './about.module.css';
import {
  useAboutInteractions,
  type AboutRefs,
  type AboutClassNames,
} from './AboutInteractions';

/* ==========================================================================
   Static data
   ========================================================================== */

const STATS = [
  { target: 40, suffix: '+', label: 'Years' },
  { target: 50, suffix: '+', label: 'Countries' },
  { target: 10000, suffix: '+', label: 'Happy Camps' },
  { target: 1000000, suffix: '+', label: 'Epic Launches' },
];

const TIMELINE = [
  {
    year: '1985',
    title: 'The Beginning',
    description:
      'Water Blob was born from a simple idea: create the most exhilarating water experience imaginable. What started as a family project quickly became a beloved fixture at summer camps across America.',
  },
  {
    year: '1992',
    title: 'First Hollywood Appearance',
    description:
      'The Water Blob made its silver-screen debut in the beloved summer camp movie Heavyweights, introducing millions to the thrill of blob launching and cementing its place in pop culture.',
  },
  {
    year: '2000',
    title: 'Global Expansion',
    description:
      'Demand surged beyond the United States as camps, resorts, and waterparks across Europe, Australia, and beyond discovered the magic of the Water Blob. International distribution partnerships were formed.',
  },
  {
    year: '2010',
    title: 'Blockbuster Features',
    description:
      'The Water Blob took center stage in Jackass 3D and Piranha 3D, delivering unforgettable moments on the big screen and sparking a new wave of interest from adventure seekers worldwide.',
  },
  {
    year: '2015',
    title: 'Musical Moments',
    description:
      'The Water Blob starred in Pitch Perfect 2 and Carrie Underwood\'s Southbound music video, proving it belongs wherever fun and excitement collide.',
  },
  {
    year: '2024',
    title: '40 Years Strong',
    description:
      'Four decades of innovation, quality, and pure joy. Water Blob continues to be the gold standard for water launchers, trusted by families, camps, and entertainers around the globe.',
  },
];

const MEDIA_CARDS = [
  {
    icon: '\uD83C\uDFAC',
    title: 'Jackass 3D',
    type: 'Feature Film',
    desc: 'Steve-O and the crew took blob launching to the extreme in one of the franchise\'s most iconic stunts.',
  },
  {
    icon: '\uD83C\uDFA4',
    title: 'Pitch Perfect 2',
    type: 'Feature Film',
    desc: 'The Barden Bellas hit the lake for a memorable Water Blob scene that had audiences cheering.',
  },
  {
    icon: '\uD83C\uDFAC',
    title: 'Piranha 3D',
    type: 'Feature Film',
    desc: 'The Water Blob made a splash in this aquatic horror-comedy blockbuster, stealing scenes from the piranhas.',
  },
  {
    icon: '\uD83C\uDFAC',
    title: 'Heavyweights',
    type: 'Feature Film',
    desc: 'The 1995 classic that introduced a generation to the thrill of blob launching at Camp Hope.',
  },
  {
    icon: '\uD83C\uDF7A',
    title: 'Twisted Tea',
    type: 'Commercial',
    desc: 'Twisted Tea featured the Water Blob in their summer ad campaign, pairing cold drinks with epic launches.',
  },
  {
    icon: '\uD83C\uDFB5',
    title: 'Southbound',
    type: 'Music Video',
    desc: 'Carrie Underwood\'s hit music video captured the pure summer joy of a Water Blob launch.',
  },
];

const QUALITY_CARDS = [
  {
    icon: '\uD83D\uDCA0',
    title: 'Premium Materials',
    desc: 'Commercial-grade PVC and reinforced vinyl engineered to withstand years of heavy use in any climate.',
  },
  {
    icon: '\u2705',
    title: 'Rigorous Testing',
    desc: 'Every Water Blob undergoes extensive pressure testing and quality inspection before it leaves our facility.',
  },
  {
    icon: '\uD83D\uDEE1\uFE0F',
    title: 'Safety First',
    desc: 'Designed with safety in mind — reinforced seams, secure anchor points, and comprehensive safety guidelines included.',
  },
  {
    icon: '\uD83D\uDD27',
    title: 'Expert Craftsmanship',
    desc: 'Hand-welded by skilled technicians with decades of experience in inflatable manufacturing.',
  },
  {
    icon: '\uD83C\uDF3F',
    title: 'Eco-Conscious',
    desc: 'We use environmentally responsible materials and processes, minimizing waste throughout our production cycle.',
  },
  {
    icon: '\uD83D\uDCDE',
    title: 'Lifetime Support',
    desc: 'Our customer service team is here for you long after purchase — repairs, parts, and expert advice, anytime.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'We\'ve had our Water Blob for over 15 years and it\'s still the most popular activity at camp. Kids line up every morning to get their turn. Absolutely worth every penny.',
    author: 'Mike Thompson',
    role: 'Director, Camp Pinewood',
  },
  {
    quote:
      'The quality is unmatched. We compared several brands before choosing Water Blob and there\'s simply no contest. The durability, the bounce, the customer service — all world-class.',
    author: 'Sarah Chen',
    role: 'Operations Manager, Lakeside Resort',
  },
  {
    quote:
      'Our guests travel from across the country just to experience our Water Blob. It\'s become the centerpiece of our lake activities and the number one thing people mention in reviews.',
    author: 'James Rodriguez',
    role: 'Owner, Sunset Lake Adventures',
  },
  {
    quote:
      'From ordering to setup, the Water Blob team made everything seamless. They even helped us plan the ideal anchoring layout for our lake. True professionals who care about their product.',
    author: 'Emily Watson',
    role: 'Activities Coordinator, YMCA Camp',
  },
];

const REGIONS = [
  { icon: '\uD83C\uDDFA\uD83C\uDDF8', name: 'North America' },
  { icon: '\uD83C\uDDEA\uD83C\uDDFA', name: 'Europe' },
  { icon: '\uD83C\uDDE6\uD83C\uDDFA', name: 'Australia & Oceania' },
  { icon: '\uD83C\uDDF2\uD83C\uDDFD', name: 'Latin America' },
  { icon: '\uD83C\uDDE6\uD83C\uDDEA', name: 'Middle East' },
  { icon: '\uD83C\uDDEF\uD83C\uDDF5', name: 'Asia' },
];

/* ==========================================================================
   About Page Component
   ========================================================================== */

export default function AboutPage() {
  /* --- Refs --- */
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const statsSectionRef = useRef<HTMLElement | null>(null);
  const statNumbersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const timelineItemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const carouselTrackRef = useRef<HTMLDivElement | null>(null);
  const carouselDotsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const mediaCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const qualityCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const regionBadgesRef = useRef<(HTMLDivElement | null)[]>([]);
  const founderSectionRef = useRef<HTMLElement | null>(null);
  const founderImageRef = useRef<HTMLDivElement | null>(null);
  const signatureRef = useRef<HTMLParagraphElement | null>(null);

  const aboutRefs: AboutRefs = {
    heroCanvas: heroCanvasRef,
    statsSection: statsSectionRef,
    statNumbers: statNumbersRef,
    timelineItems: timelineItemsRef,
    carouselTrack: carouselTrackRef,
    carouselDots: carouselDotsRef,
    mediaCards: mediaCardsRef,
    qualityCards: qualityCardsRef,
    regionBadges: regionBadgesRef,
    founderSection: founderSectionRef,
    founderImage: founderImageRef,
    signatureEl: signatureRef,
  };

  const aboutClassNames: AboutClassNames = {
    visible: styles.visible,
    carouselDotActive: styles.carouselDotActive,
  };

  const { goToSlide } = useAboutInteractions(aboutRefs, aboutClassNames);

  /* --- Ref callback helpers --- */
  const setStatNumberRef = useCallback(
    (index: number) => (el: HTMLSpanElement | null) => {
      statNumbersRef.current[index] = el;
    },
    []
  );

  const setTimelineRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      timelineItemsRef.current[index] = el;
    },
    []
  );

  const setMediaCardRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      mediaCardsRef.current[index] = el;
    },
    []
  );

  const setQualityCardRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      qualityCardsRef.current[index] = el;
    },
    []
  );

  const setRegionBadgeRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      regionBadgesRef.current[index] = el;
    },
    []
  );

  const setCarouselDotRef = useCallback(
    (index: number) => (el: HTMLButtonElement | null) => {
      carouselDotsRef.current[index] = el;
    },
    []
  );

  /* ====================================================================== */

  return (
    <main>
      {/* -------- Hero -------- */}
      <section className={styles.hero}>
        <canvas ref={heroCanvasRef} className={styles.heroCanvas} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>Since 1985</span>
          <h1 className={styles.heroTitle}>
            The Original{' '}
            <span className={styles.heroTitleAccent}>Water Blob</span>
            <sup>&reg;</sup>
          </h1>
          <p className={styles.heroSubtitle}>
            For over four decades, Water Blob has been the gold standard for
            water launchers — trusted by summer camps, resorts, and families
            around the world.
          </p>
        </div>
      </section>

      {/* -------- Stats -------- */}
      <section className={styles.stats} ref={statsSectionRef}>
        <div className={styles.statsInner}>
          <p className={styles.sectionLabel}>By the Numbers</p>
          <h2 className={styles.sectionTitle}>
            Decades of Making Waves
          </h2>
          <p className={styles.sectionSubtitle}>
            From a single prototype to a worldwide phenomenon — the numbers
            speak for themselves.
          </p>
          <div className={styles.statsGrid}>
            {STATS.map((stat, i) => (
              <div className={styles.statCard} key={stat.label}>
                <div className={styles.statNumber}>
                  <span
                    ref={setStatNumberRef(i)}
                    data-target={stat.target}
                    data-suffix={stat.suffix}
                  >
                    0{stat.suffix}
                  </span>
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------- Timeline -------- */}
      <section className={styles.timeline}>
        <div className={styles.timelineInner}>
          <div className={styles.timelineHeader}>
            <p className={styles.sectionLabel}>Our Journey</p>
            <h2 className={styles.sectionTitle}>
              40+ Years of Water Blob
            </h2>
          </div>
          <div className={styles.timelineLine}>
            {TIMELINE.map((item, i) => (
              <div
                key={item.year}
                className={styles.timelineItem}
                ref={setTimelineRef(i)}
              >
                <div className={styles.timelineDot} />
                <p className={styles.timelineYear}>{item.year}</p>
                <h3 className={styles.timelineTitle}>{item.title}</h3>
                <p className={styles.timelineDescription}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------- Founder -------- */}
      <section className={styles.founder} ref={founderSectionRef}>
        <div className={styles.founderInner}>
          <div className={styles.founderImageWrap} ref={founderImageRef}>
            <Image
              src="/assets/about/JUNIOR3_094_42608b5d-3bfe-4f81-8870-3dd7fb5ca01a.jpg"
              alt="Water Blob family legacy"
              width={600}
              height={750}
              className={styles.founderImage}
              priority={false}
            />
            <div className={styles.founderImageOverlay} />
          </div>
          <div className={styles.founderText}>
            <p className={styles.sectionLabel}>Our Story</p>
            <h2 className={styles.sectionTitle}>A Family Legacy</h2>
            <p className={styles.founderQuote}>
              The Water Blob story is, at its heart, a family story. What began
              as a passion project has grown into a legacy that spans
              generations. We started with a simple belief: that the best
              memories are made on the water, surrounded by laughter, courage,
              and a little bit of splashing.
            </p>
            <p className={styles.founderQuote}>
              Every Water Blob that leaves our facility carries that same spirit.
              We personally oversee every step of the process — from material
              selection to the final quality check — because our family name is
              on every product. When you choose Water Blob, you are not just
              buying an inflatable; you are joining a tradition of summer joy
              that has connected families, camps, and communities for over 40
              years.
            </p>
            <p className={styles.founderQuote}>
              We are proud to continue the mission my family started: to bring
              people together on the water and create moments they will never
              forget.
            </p>
            <p
              className={styles.founderSignature}
              ref={signatureRef}
            >
              - Lorie Latimer, Owner
            </p>
          </div>
        </div>
      </section>

      {/* -------- Media / As Seen In -------- */}
      <section className={styles.media}>
        <div className={styles.mediaInner}>
          <div className={styles.mediaHeader}>
            <p className={styles.sectionLabel}>As Seen In</p>
            <h2 className={styles.sectionTitle}>
              From Summer Camps to the Big Screen
            </h2>
            <p className={styles.sectionSubtitle} style={{ margin: '0 auto' }}>
              The Water Blob has starred alongside Hollywood&rsquo;s biggest
              names and entertained millions worldwide.
            </p>
          </div>
          <div className={styles.mediaGrid}>
            {MEDIA_CARDS.map((card, i) => (
              <div
                key={card.title}
                className={styles.mediaCard}
                ref={setMediaCardRef(i)}
                data-stagger={i * 100}
              >
                <div className={styles.mediaIcon}>{card.icon}</div>
                <p className={styles.mediaCardType}>{card.type}</p>
                <h3 className={styles.mediaCardTitle}>{card.title}</h3>
                <p className={styles.mediaCardDesc}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------- Manufacturing / Quality -------- */}
      <section className={styles.manufacturing}>
        <div className={styles.manufacturingInner}>
          <div className={styles.manufacturingHeader}>
            <p className={styles.sectionLabel}>Uncompromising Quality</p>
            <h2 className={styles.sectionTitle}>
              Built to Last, Designed to Thrill
            </h2>
            <p className={styles.sectionSubtitle} style={{ margin: '0 auto' }}>
              Every Water Blob is crafted with the same care and precision that
              has defined our brand for over four decades.
            </p>
          </div>
          <div className={styles.qualityGrid}>
            {QUALITY_CARDS.map((card, i) => (
              <div
                key={card.title}
                className={styles.qualityCard}
                ref={setQualityCardRef(i)}
                data-stagger={i * 100}
              >
                <div className={styles.qualityIcon}>{card.icon}</div>
                <h3 className={styles.qualityCardTitle}>{card.title}</h3>
                <p className={styles.qualityCardDesc}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------- Testimonials -------- */}
      <section className={styles.testimonials}>
        <div className={styles.testimonialsInner}>
          <div className={styles.testimonialsHeader}>
            <p className={styles.sectionLabel}>Testimonials</p>
            <h2 className={styles.sectionTitle}>
              Hear From Our Community
            </h2>
          </div>
          <div className={styles.carouselWrapper}>
            <div className={styles.carouselTrack} ref={carouselTrackRef}>
              {TESTIMONIALS.map((t) => (
                <div key={t.author} className={styles.testimonialSlide}>
                  <p className={styles.testimonialQuote}>{t.quote}</p>
                  <p className={styles.testimonialAuthor}>{t.author}</p>
                  <p className={styles.testimonialRole}>{t.role}</p>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.carouselDots}>
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                className={`${styles.carouselDot}${
                  i === 0 ? ` ${styles.carouselDotActive}` : ''
                }`}
                ref={setCarouselDotRef(i)}
                onClick={() => goToSlide(i, TESTIMONIALS.length)}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* -------- Global Reach -------- */}
      <section className={styles.globalReach}>
        <div className={styles.globalReachInner}>
          <div className={styles.globalReachHeader}>
            <p className={styles.sectionLabel}>Trusted Worldwide</p>
            <h2 className={styles.sectionTitle}>
              Making Waves Across the Globe
            </h2>
            <p className={styles.sectionSubtitle} style={{ margin: '0 auto' }}>
              Water Blob products are enjoyed in over 50 countries, from mountain
              lakes to tropical coastlines.
            </p>
          </div>
          <div className={styles.worldMapPlaceholder}>
            World Map — Coming Soon
          </div>
          <div className={styles.regionGrid}>
            {REGIONS.map((region, i) => (
              <div
                key={region.name}
                className={styles.regionBadge}
                ref={setRegionBadgeRef(i)}
                data-stagger={i * 80}
              >
                <span className={styles.regionIcon}>{region.icon}</span>
                <span className={styles.regionName}>{region.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------- Video Section -------- */}
      <section className={styles.videoSection}>
        <div className={styles.videoSectionInner}>
          <p className={styles.sectionLabel}>See It in Action</p>
          <h2 className={styles.sectionTitle}>
            The Water Blob Experience
          </h2>
          <div className={styles.videoPlaceholder}>
            Video Player — Coming Soon
          </div>
        </div>
      </section>

      {/* -------- CTA -------- */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Experience the Original</h2>
          <p className={styles.ctaDesc}>
            Join thousands of camps, resorts, and families who trust Water Blob
            for the ultimate water experience. Browse our full lineup of
            commercial-grade water launchers.
          </p>
          <Link href="/products" className={styles.ctaButton}>
            Shop Water Blob&reg; Products
          </Link>
        </div>
      </section>
    </main>
  );
}
