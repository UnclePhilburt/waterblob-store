'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './guidelines.module.css';

interface Section {
  id: string;
  title: string;
  navLabel: string;
  icon: string;
  intro?: string;
}

const sections: Section[] = [
  {
    id: 'notice',
    title: 'Important Information',
    navLabel: 'Notice',
    icon: '!',
    intro:
      'Read this manual before assembling and using your Water Blob\u00AE. Keep it for future reference. For questions about assembly, parts, or warranty, contact Springfield Special Products.',
  },
  {
    id: 'warnings',
    title: 'Safety Warnings',
    navLabel: 'Warnings',
    icon: '\u26A0',
    intro:
      'To reduce the risk of serious injury or death, follow every rule below without exception.',
  },
  {
    id: 'liability',
    title: 'Release of Liability',
    navLabel: 'Liability',
    icon: '\u00A7',
  },
  {
    id: 'assembly',
    title: 'Assembly & Inflation',
    navLabel: 'Assembly',
    icon: '\u2699',
  },
  {
    id: 'use',
    title: 'Product Use Instructions',
    navLabel: 'Use',
    icon: '\u25B6',
  },
  {
    id: 'safe-use',
    title: 'How to Use the Water Blob\u00AE Safely',
    navLabel: 'Safe Use',
    icon: '\u2713',
  },
  {
    id: 'care',
    title: 'Care & Maintenance',
    navLabel: 'Care',
    icon: '\u2728',
  },
  {
    id: 'warranty',
    title: 'Warranty Policy',
    navLabel: 'Warranty',
    icon: '\u25C6',
  },
  {
    id: 'contact',
    title: 'Contact Springfield Special Products',
    navLabel: 'Contact',
    icon: '\u260E',
  },
];

const warnings: string[] = [
  'This is NOT a life-saving device \u2014 always use a USCG-approved life vest.',
  'Never leave children unattended.',
  'Use only under competent adult supervision.',
  'Only 2 persons at a time \u2014 exceeding this limit increases the risk of injury.',
  'Not for children under 6 years old.',
  'Do not use if damaged or leaking air.',
  'Do not use under the influence of drugs or alcohol.',
  'Do not use if underinflated \u2014 this can cause entrapment, leading to serious injury or death.',
  'Use only in water with a minimum depth of 8 feet, away from personal watercraft, docks, bridges, or hazardous objects.',
  'This product is NOT towable. Never tow or pull the Water Blob\u00AE with any watercraft, vehicle, or person on board.',
  'Do not drag across land or rough surfaces.',
  'Must be properly anchored.',
  'No aerial tricks or gymnastics. No flips or somersaults \u2014 landing on your head or neck can cause serious injury, paralysis, or death.',
  'Jumping height increases risk. Use caution and common sense at all times.',
  'Do not drag by D-Rings.',
];

const assemblySteps: string[] = [
  'Lay the Water Blob\u00AE flat on a smooth surface free of debris.',
  'Inflate using a leaf blower or a shop vac with a two-way switch.',
  'Takes about 10\u201315 minutes to inflate.',
  'Inflate to \u00BD to \u00BE full of air.',
  'Slowly guide into the water while ensuring no sharp objects are underneath.',
  'Run anchor straps in a criss\u2011cross pattern underneath the blob \u2014 this keeps it steady and prevents it from shifting or rolling during use.',
  'Anchor using shock cord and 50 gallon buckets of concrete. Crisscross the anchor points.',
];

const useRules: string[] = [
  'Use only during daylight hours in a well-lit area.',
  'Maintain at least 12 feet of open water space on all sides and 8 feet of clearance above jumpers.',
  'Do not use under bridges, trees, docks, or any overhead obstructions.',
  'Only competent adults should supervise use.',
  'Only 2 people at a time \u2014 exceeding this limit may cause serious injury.',
  'Ensure the blob is anchored properly before each use.',
  'Check for leaks, damage, or improper inflation before each use.',
  'Never swim under the Water Blob\u00AE.',
  'Take breaks and avoid use when tired.',
];

const safeUseRules: string[] = [
  'The Water Blob\u00AE area must be supervised by an authorized staff member.',
  'Life vests are mandatory and must be securely fastened.',
  'Only two users at a time: one "bouncer" on the end and one "jumper".',
  'Weight difference between users must be no more than 30\u201350 lbs.',
  'A staff member must be stationed on the platform to supervise all jumps.',
  'Jumpers must land bottom-first onto the blob.',
  'When being launched, the rider must lace their fingers together and place their hands behind their neck to protect the head and spine on landing.',
  'New jumpers must wait until previous users have exited the water.',
];

const liabilityPoints: string[] = [
  'You have read and understood this manual, including all warnings.',
  'Any additional or future users will also read and follow these instructions.',
  'Improper use may result in serious injury or death.',
  'Springfield Special Products is not liable for injuries, damages, or expenses related to misuse of this product.',
];

const careDo: string[] = [
  'Monitor air pressure \u2014 heat can cause expansion, possibly damaging seams.',
  'If stored in a cool area, add air before use.',
  'Inflate on dry land only \u2014 never inflate in water (risk of electric shock).',
  'Check inflation levels before each use to ensure safety and extend product life.',
  'Clean with mild soap and water or a gentle detergent.',
  'Store in a cool, dry place, away from direct sunlight.',
  'Use plastic trash cans or wooden crates to prevent insects or rodents from damaging it.',
  'If punctured, contact us for repair advice.',
];

const careDont: string[] = [
  'Drag it on the ground.',
  'Overinflate in hot weather.',
  'Pull it out of the water using a vehicle.',
  'Pull by D-Rings.',
];

const warrantyCovered =
  'Springfield Special Products provides the original purchaser with a limited warranty against defects in workmanship. This warranty covers workmanship defects only and is handled on a case-by-case basis at the sole discretion of Springfield Special Products.';

const warrantyExcluded: string[] = [
  'Normal wear and tear.',
  'Punctures, cuts, or abrasions from use.',
  'Rental or commercial use.',
  'Damage from improper use, inflation, anchoring, storage, or maintenance.',
];

export default function GuidelinesPage() {
  const [activeCategory, setActiveCategory] = useState<string>('notice');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const handleNavClick = useCallback((sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      const offset = 140;
      const targetPosition = element.offsetTop - offset;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const entries = Object.entries(sectionRefs.current).filter(
      ([, el]) => el !== null
    ) as [string, HTMLElement][];

    const observer = new IntersectionObserver(
      (observed) => {
        observed.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-section-id');
            if (id) setActiveCategory(id);
          }
        });
      },
      { threshold: 0.25 }
    );

    entries.forEach(([, el]) => observer.observe(el));
    return () => entries.forEach(([, el]) => observer.unobserve(el));
  }, []);

  const renderSection = (section: Section, body: React.ReactNode) => (
    <section
      key={section.id}
      id={section.id}
      data-section-id={section.id}
      ref={(el) => {
        sectionRefs.current[section.id] = el;
      }}
      className={styles.section}
    >
      <h2 className={styles.sectionTitle}>
        <span className={styles.sectionIcon} aria-hidden="true">
          {section.icon}
        </span>
        {section.title}
      </h2>
      {section.intro && (
        <p className={styles.sectionDescription}>{section.intro}</p>
      )}
      {body}
    </section>
  );

  return (
    <main>
      <header className={styles.hero}>
        <p className={styles.heroEyebrow}>Operator&rsquo;s Manual</p>
        <h1 className={styles.heroTitle}>Safety &amp; Guidelines</h1>
        <p className={styles.heroDescription}>
          Read this manual before assembling and using your Water Blob&reg;.
          These guidelines are required for every operator and every user.
        </p>
        <div className={styles.heroBadge}>This product is NOT towable.</div>
      </header>

      <nav className={styles.nav}>
        <div className={styles.navInner}>
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleNavClick(s.id)}
              className={`${styles.navLink} ${
                activeCategory === s.id ? styles.navLinkActive : ''
              }`}
            >
              {s.navLabel}
            </button>
          ))}
        </div>
      </nav>

      <div className={styles.content}>
        <div className={styles.container}>
          {renderSection(
            sections[0],
            <div className={styles.callout}>
              <strong>Do not return this product without prior consent.</strong>
              <p>
                For questions about assembly, parts, or warranty, call{' '}
                <a href="tel:+14178648461">417-864-8461</a> (8&nbsp;AM &ndash;
                4:30&nbsp;PM CST, Monday &ndash; Friday).
              </p>
            </div>
          )}

          {renderSection(
            sections[1],
            <>
              <ul className={styles.warningList}>
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              <p className={styles.riskNote}>Use at your own risk.</p>
            </>
          )}

          {renderSection(
            sections[2],
            <>
              <p className={styles.sectionDescription}>
                By assembling and inflating this product, you agree that:
              </p>
              <ul className={styles.list}>
                {liabilityPoints.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </>
          )}

          {renderSection(
            sections[3],
            <>
              <h3 className={styles.subheading}>How to inflate</h3>
              <ol className={styles.orderedList}>
                {assemblySteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <h3 className={styles.subheading}>Recommended air pumps</h3>
              <ul className={styles.list}>
                <li>Leaf blower</li>
                <li>Shop vac with a two-way switch</li>
              </ul>
            </>
          )}

          {renderSection(
            sections[4],
            <ul className={styles.list}>
              {useRules.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}

          {renderSection(
            sections[5],
            <>
              <ul className={styles.list}>
                {safeUseRules.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <div className={styles.callout}>
                <strong>Warning:</strong>
                <ul className={styles.list}>
                  <li>Reckless use can result in injury.</li>
                  <li>No flips, twists, or aerial acrobatics.</li>
                  <li>No alcohol or drug use while on the Water Blob&reg;.</li>
                  <li>Check local laws for water sports regulations.</li>
                  <li>Have emergency contacts and first aid available.</li>
                </ul>
              </div>
            </>
          )}

          {renderSection(
            sections[6],
            <div className={styles.twoColumn}>
              <div className={styles.doCard}>
                <h3 className={styles.cardTitle}>Do</h3>
                <ul className={styles.list}>
                  {careDo.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.dontCard}>
                <h3 className={styles.cardTitle}>Do not</h3>
                <ul className={styles.list}>
                  {careDont.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {renderSection(
            sections[7],
            <>
              <p className={styles.sectionDescription}>{warrantyCovered}</p>
              <h3 className={styles.subheading}>Not covered</h3>
              <ul className={styles.list}>
                {warrantyExcluded.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              <div className={styles.callout}>
                <strong>
                  Prior authorization is required for all returns.
                </strong>
                <p>
                  Returns sent without prior approval will not receive credit.
                </p>
              </div>
            </>
          )}

          {renderSection(
            sections[8],
            <div className={styles.contactGrid}>
              <div>
                <p className={styles.contactLabel}>Address</p>
                <p>
                  Springfield Special Products
                  <br />
                  2045 N. National Ave.
                  <br />
                  Springfield, MO 65803, USA
                </p>
              </div>
              <div>
                <p className={styles.contactLabel}>Phone</p>
                <p>
                  <a href="tel:+18002237571">800-223-7571</a>
                  <br />
                  <a href="tel:+14178648461">417-864-8461</a>
                </p>
                <p className={styles.contactLabel}>Fax</p>
                <p>417-864-7628</p>
              </div>
              <div>
                <p className={styles.contactLabel}>Online</p>
                <p>
                  <a href="mailto:info@thewaterblob.com">
                    info@thewaterblob.com
                  </a>
                  <br />
                  <a
                    href="https://www.thewaterblob.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    www.thewaterblob.com
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <section className={styles.cta}>
        <div className="container">
          <h2 className={styles.ctaTitle}>Questions before you order?</h2>
          <p className={styles.ctaDescription}>
            Our team helps camps, resorts, and private owners pick the right
            Water Blob&reg; and set it up safely.
          </p>
          <Link href="/contact" className="btn btn-primary">
            Contact Us &rarr;
          </Link>
        </div>
      </section>
    </main>
  );
}
