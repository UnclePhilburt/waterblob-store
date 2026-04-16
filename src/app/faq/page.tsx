'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './faq.module.css';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  items: FaqItem[];
}

const faqData: FaqCategory[] = [
  {
    id: 'general',
    title: 'General Questions',
    icon: '?',
    description: 'Learn the basics about Water Blob\u00AE and how it works',
    items: [
      {
        question: 'What is a Water Blob\u00AE?',
        answer:
          'A Water Blob\u00AE is a large inflatable water launcher made from commercial-grade 22oz PVC vinyl. One person sits on the end of the blob while another person jumps onto the opposite end, launching the seated person up to 10+ feet into the air. Water Blob\u00AE has been the original and most trusted name in water launching since 1984.',
      },
      {
        question: 'How does a Water Blob\u00AE work?',
        answer:
          'Water Blob\u00AE is designed for 2 people at a time: One person sits on the end of the blob while another person jumps onto the opposite end, launching the seated person into the air. This is the safe, proper way to use a Water Blob\u00AE\u2014and it\u2019s the way that creates those spectacular launches you see in photos and videos.',
      },
      {
        question: 'What makes Water Blob\u00AE different from other water toys?',
        answer:
          'Water Blob\u00AE is the original water launcher since 1984, featuring premium 22oz PVC vinyl construction that resists tears, UV damage, and harsh weather. Our commercial-grade design is built to handle hundreds of launches daily, has been featured in Hollywood films, and is trusted by over 500 summer camps globally. We focus on safety, durability, and creating developmental experiences\u2014not just fun.',
      },
      {
        question: 'Where has Water Blob\u00AE been featured in media?',
        answer:
          'Water Blob\u00AE has been featured in major Hollywood films including Jackass 3D (2010), Pitch Perfect 2 (2015), Piranha 3D (2010), and Heavyweights (1995). It has also appeared in commercials (Twisted Tea) and music videos (Carrie Underwood\u2019s "Southbound").',
      },
      {
        question: 'Can adults use the Water Blob\u00AE?',
        answer:
          'Absolutely! Water Blob\u00AE is designed for all ages and weight ranges. Adults can be launchers or riders. In fact, adult supervision and participation is encouraged for safety and fun. The commercial-grade construction handles adult weights easily.',
      },
    ],
  },
  {
    id: 'sizing',
    title: 'Sizing & Selection',
    icon: '\uD83D\uDCCF',
    description: 'Choose the perfect Water Blob\u00AE size for your needs',
    items: [
      {
        question: 'What sizes do Water Blob\u00AE products come in?',
        answer:
          'Water Blob\u00AE comes in four sizes: 25ft (perfect for smaller venues and private lakes), 30ft (ideal for summer camps and resorts), 35ft (for high-traffic camps and water parks), and 40ft (professional-grade for maximum launch height). All sizes accommodate 2 people at a time.',
      },
      {
        question: 'Which size Water Blob\u00AE should I choose for my camp?',
        answer:
          'Size affects launch height and intimidation factor, not capacity (all sizes accommodate 2 people at a time). Choose based on: launch height desired, age/experience of campers, available waterfront space, and budget. Larger blobs (35ft-40ft) provide higher launches and are less intimidating for younger campers. Smaller blobs (25ft-30ft) are more portable and budget-friendly.',
      },
      {
        question: 'How much does a Water Blob\u00AE weigh?',
        answer:
          'Weight varies by size: 25ft models weigh approximately 100-150 lbs, 30ft models weigh approximately 150-200 lbs, 35ft models weigh approximately 200-250 lbs, and 40ft models weigh approximately 250-300+ lbs. These are approximate weights when deflated and packed.',
      },
      {
        question: 'Can I customize the color of my Water Blob\u00AE?',
        answer:
          'Water Blob\u00AE products come in our standard color configurations designed for maximum visibility and safety on the water. Custom colors are not available for Water Blob\u00AE products at this time.',
      },
    ],
  },
  {
    id: 'safety',
    title: 'Safety',
    icon: '\uD83D\uDEE1\uFE0F',
    description: 'Important safety information for worry-free fun',
    items: [
      {
        question: 'Is Water Blob\u00AE safe?',
        answer:
          'Yes, Water Blob\u00AE products are safety certified with reinforced seams, commercial-grade construction, and materials that meet all international safety standards. Proper usage (2 people at a time, proper supervision, appropriate water depth) ensures safe operation. Our commercial-grade construction has been trusted by camps and resorts worldwide for over 40 years.',
      },
      {
        question: 'How many people can be on a Water Blob\u00AE at once?',
        answer:
          'Only 2 people should be on the Water Blob\u00AE at once\u2014one person sits on one end and another jumps on the opposite end. This is for safety reasons and is the proper way to use all Water Blob\u00AE sizes.',
      },
      {
        question: 'How deep does the water need to be for a Water Blob\u00AE?',
        answer:
          'Water depth should be at least 8-10 feet deep in the landing zone to ensure safe diving and launching. The blob should be anchored in an area free of underwater obstacles, rocks, or shallow areas.',
      },
      {
        question: 'What age range is appropriate for Water Blob\u00AE?',
        answer:
          'Water Blob\u00AE is typically appropriate for ages 8 and up, depending on swimming ability and comfort level. Younger or less experienced swimmers may start with smaller sizes (25ft-30ft) which are less intimidating. Always ensure proper supervision and that all participants are strong swimmers wearing life jackets.',
      },
      {
        question: 'Do participants need to wear life jackets on the Water Blob\u00AE?',
        answer:
          'Yes, we strongly recommend all participants wear properly fitted life jackets or personal flotation devices (PFDs) at all times when using the Water Blob\u00AE. This is especially important for younger participants and less confident swimmers.',
      },
      {
        question: 'Can I use a Water Blob\u00AE in a pool?',
        answer:
          'Water Blob\u00AE is designed for open water use (lakes, ponds, ocean) with sufficient depth and space. It is not recommended for pool use due to size constraints, launch height, and potential damage to pool walls and edges. Minimum recommended space is at least 30x30 feet of clear water.',
      },
    ],
  },
  {
    id: 'setup',
    title: 'Setup & Installation',
    icon: '\uD83D\uDEE0\uFE0F',
    description: 'Get your Water Blob\u00AE ready for action',
    items: [
      {
        question: 'How long does it take to set up a Water Blob\u00AE?',
        answer:
          'A Water Blob\u00AE can be set up and ready for action in under 30 minutes. The process involves inflating the blob with an air pump, anchoring it securely to the lake bottom using the included anchor system, and conducting a safety check before use.',
      },
      {
        question: 'What equipment do I need to set up a Water Blob\u00AE?',
        answer:
          "You'll need: an electric air pump (high-volume pump recommended), anchor weights or sand bags, anchor lines/ropes, and life jackets for all participants. The Water Blob\u00AE comes with anchor attachment points. Most camps use boat anchors or weighted anchor systems.",
      },
      {
        question: 'How do I anchor my Water Blob\u00AE properly?',
        answer:
          "Use heavy-duty anchors (mushroom anchors, boat anchors, or weighted sand bags\u2014minimum 50 lbs per anchor point) attached to the blob's anchor points with marine-grade rope or chain. Use multiple anchor points (typically 4-6) to keep the blob stable and prevent drifting. Ensure anchors are set in at least 8-10 feet of water and the blob has adequate clearance from docks, boats, and shallow areas.",
      },
      {
        question: 'What type of pump do I need to inflate a Water Blob\u00AE?',
        answer:
          "You'll need a high-volume electric air pump (not a high-pressure pump). Look for pumps rated for large inflatables with CFM (cubic feet per minute) ratings of 200+ for faster inflation. Standard pool float pumps will work but take longer. We recommend commercial-grade inflatable pumps available at marine or outdoor recreation stores.",
      },
      {
        question: 'Does Water Blob\u00AE require electricity to stay inflated?',
        answer:
          "No, Water Blob\u00AE is an air-filled inflatable (not a continuous air blower system). Once inflated and sealed, it stays inflated without electricity. You'll need to top off air pressure periodically (every few days or weekly depending on usage and temperature changes).",
      },
      {
        question: 'Can I leave my Water Blob\u00AE inflated in the water all summer?',
        answer:
          'While Water Blob\u00AE is built for durability, we recommend deflating and removing it from the water during extended non-use periods (more than a few days) to prevent algae buildup, UV damage, and wear from waves and weather. Many camps leave it inflated during the active camp season (6-8 weeks) with regular cleaning and inspection.',
      },
    ],
  },
  {
    id: 'maintenance',
    title: 'Maintenance & Care',
    icon: '\uD83D\uDD27',
    description: 'Keep your Water Blob\u00AE in top condition for years',
    items: [
      {
        question: 'How do I maintain my Water Blob\u00AE?',
        answer:
          'Regular maintenance includes: rinsing with fresh water after each use, allowing it to dry completely before storage, storing in a cool, dry place away from direct sunlight, inspecting seams and surface for wear before each season, and keeping it clean of algae and debris. Proper maintenance ensures years of reliable use.',
      },
      {
        question: 'How long does a Water Blob\u00AE last?',
        answer:
          'With proper care and maintenance, a Water Blob\u00AE can last 5-10+ years. Our commercial-grade 22oz PVC vinyl construction is built to handle hundreds of launches daily at busy summer camps. Lifespan depends on usage frequency, maintenance, and storage conditions.',
      },
      {
        question: 'Can Water Blob\u00AE be used in saltwater?',
        answer:
          'Yes, Water Blob\u00AE can be used in saltwater. However, you must rinse it thoroughly with fresh water after each saltwater use to prevent salt buildup and material degradation. Saltwater environments require more frequent maintenance and inspection.',
      },
      {
        question: 'What if my Water Blob\u00AE gets a hole or tear?',
        answer:
          'Small punctures and tears can be repaired using PVC vinyl patch kits (similar to pool float repair kits). Clean and dry the damaged area, apply PVC adhesive, and press the patch firmly. For larger tears or seam damage, contact Water Blob\u00AE for professional repair services.',
      },
    ],
  },
  {
    id: 'shipping',
    title: 'Shipping & Returns',
    icon: '\uD83D\uDCE6',
    description: 'Delivery, warranties, and policies',
    items: [
      {
        question: 'Do you ship Water Blob\u00AE products nationwide?',
        answer:
          'Yes, we ship Water Blob\u00AE products nationwide. Smaller models (25ft-30ft) ship via UPS, while larger models ship via freight. Shipping costs are calculated at checkout based on your location and the size of your order. Customer pays for shipping.',
      },
      {
        question: 'How much does shipping cost for a Water Blob\u00AE?',
        answer:
          'Shipping costs vary based on size, weight, and destination. Smaller models (25ft-30ft) typically ship via UPS with costs ranging from $50-150 depending on location. Larger models (35ft-40ft) ship via freight with costs ranging from $200-500+. Exact shipping costs are calculated at checkout.',
      },
      {
        question: 'What is your return policy?',
        answer:
          'Due to the custom nature of our commercial-grade products, all sales are final. We stand behind our quality with a manufacturer\'s warranty. If you receive a defective product, contact us within 7 days of delivery for replacement or repair options.',
      },
      {
        question: 'Do Water Blob\u00AE products come with a warranty?',
        answer:
          'Water Blob\u00AE products come with a limited manufacturer\'s warranty covering workmanship defects only. Normal wear and tear, punctures, cuts, abrasions, improper use, rental or commercial use, and damage from improper inflation, anchoring, storage, or maintenance are not covered. Warranty claims are handled on a case-by-case basis \u2014 contact us for details.',
      },
    ],
  },
];

const navCategories = [
  { id: 'general', label: 'General' },
  { id: 'sizing', label: 'Sizing & Selection' },
  { id: 'safety', label: 'Safety' },
  { id: 'setup', label: 'Setup & Installation' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'shipping', label: 'Shipping & Returns' },
];

// Build the JSON-LD structured data from the FAQ data
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqData.flatMap((category) =>
    category.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    }))
  ),
};

export default function FaqPage() {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('general');
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleToggle = useCallback((key: string) => {
    setActiveItem((prev) => (prev === key ? null : key));
  }, []);

  const handleNavClick = useCallback((categoryId: string) => {
    const element = categoryRefs.current[categoryId];
    if (element) {
      const offset = 140;
      const targetPosition = element.offsetTop - offset;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    const categoryElements = Object.entries(categoryRefs.current)
      .filter(([, el]) => el !== null)
      .map(([id, el]) => ({ id, el: el as HTMLDivElement }));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-category-id');
            if (id) {
              setActiveCategory(id);
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    categoryElements.forEach(({ el }) => observer.observe(el));

    return () => {
      categoryElements.forEach(({ el }) => observer.unobserve(el));
    };
  }, []);

  return (
    <main>
      {/* FAQ JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* FAQ Hero */}
      <header className={styles.faqHero}>
        <h1 className={styles.faqHeroTitle}>Frequently Asked Questions</h1>
        <p className={styles.faqHeroDescription}>
          Everything you need to know about Water Blob® - from sizing and safety
          to setup and maintenance
        </p>
      </header>

      {/* FAQ Category Navigation */}
      <nav className={styles.faqNav}>
        <div className={styles.faqNavInner}>
          {navCategories.map((cat) => (
            <button
              key={cat.id}
              className={`${styles.faqNavLink} ${
                activeCategory === cat.id ? styles.faqNavLinkActive : ''
              }`}
              onClick={() => handleNavClick(cat.id)}
              type="button"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </nav>

      {/* FAQ Content */}
      <section className={styles.faqContent}>
        <div className={styles.faqContainer}>
          {faqData.map((category) => (
            <div
              key={category.id}
              id={category.id}
              data-category-id={category.id}
              className={styles.faqCategory}
              ref={(el) => {
                categoryRefs.current[category.id] = el;
              }}
            >
              <h2 className={styles.faqCategoryTitle}>
                <span className={styles.faqCategoryIcon}>
                  {category.icon}
                </span>
                {category.title}
              </h2>
              <p className={styles.faqCategoryDescription}>
                {category.description}
              </p>

              {category.items.map((item, index) => {
                const itemKey = `${category.id}-${index}`;
                const isActive = activeItem === itemKey;

                return (
                  <div
                    key={itemKey}
                    className={styles.faqItem}
                  >
                    <div
                      className={styles.faqQuestion}
                      onClick={() => handleToggle(itemKey)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isActive}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggle(itemKey);
                        }
                      }}
                    >
                      <h3 className={styles.faqQuestionText}>
                        {item.question}
                      </h3>
                      <div
                        className={`${styles.faqToggle} ${
                          isActive ? styles.faqToggleActive : ''
                        }`}
                        aria-hidden="true"
                      >
                        &#9660;
                      </div>
                    </div>
                    <div
                      className={`${styles.faqAnswer} ${
                        isActive ? styles.faqAnswerActive : ''
                      }`}
                    >
                      <div className={styles.faqAnswerInner}>
                        {item.answer}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.faqCta}>
        <div className="container">
          <h2 className={styles.faqCtaTitle}>Still Have Questions?</h2>
          <p className={styles.faqCtaDescription}>
            Can&apos;t find what you&apos;re looking for? Our team is here to
            help you choose the perfect Water Blob® for your camp or venue.
          </p>
          <Link href="/products" className="btn btn-primary">
            Browse Products &rarr;
          </Link>
        </div>
      </section>
    </main>
  );
}
