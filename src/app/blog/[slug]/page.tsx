import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { blogPosts, sortedBlogPosts } from '../blogData';
import styles from './article.module.css';

/* ---------------------------------------------------
   Dynamic Metadata
   --------------------------------------------------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    return { title: 'Post Not Found | Water Blob\u00AE Blog' };
  }

  return {
    title: `${post.title} | Water Blob\u00AE Blog`,
    description: post.description,
    alternates: {
      canonical: `https://thewaterblob.com/blog/${post.slug}`,
    },
    openGraph: {
      type: 'article',
      url: `https://thewaterblob.com/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      authors: [post.author],
      images: ['/assets/homepage/logo.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: ['/assets/homepage/logo.png'],
    },
  };
}

/* ---------------------------------------------------
   Helpers
   --------------------------------------------------- */

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/* ---------------------------------------------------
   Page Component
   --------------------------------------------------- */

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    notFound();
  }

  // Related posts: all posts except the current one
  const relatedPosts = sortedBlogPosts.filter((p) => p.slug !== post.slug);

  // Article JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Water Blob\u00AE',
      logo: {
        '@type': 'ImageObject',
        url: 'https://thewaterblob.com/assets/homepage/logo.png',
      },
    },
    url: `https://thewaterblob.com/blog/${post.slug}`,
    mainEntityOfPage: `https://thewaterblob.com/blog/${post.slug}`,
  };

  return (
    <main>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Article */}
      <article className={styles.article}>
        <div className={styles.articleContainer}>
          {/* Back Link */}
          <Link href="/blog" className={styles.backLink}>
            <span className={styles.backArrow}>&larr;</span> Back to Blog
          </Link>

          {/* Category */}
          <span className={styles.categoryBadge}>{post.category}</span>

          {/* Title */}
          <h1 className={styles.title}>{post.title}</h1>

          {/* Meta */}
          <div className={styles.meta}>
            <span>{formatDate(post.date)}</span>
            <span className={styles.metaDivider} />
            <span>{post.readTime} read</span>
            <span className={styles.metaDivider} />
            <span>{post.author}</span>
          </div>

          {/* Content */}
          <div className={styles.content}>
            {post.content.map((section, idx) => (
              <div key={idx}>
                <h2 className={styles.sectionHeading}>{section.heading}</h2>
                {section.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className={styles.paragraph}>
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedContainer}>
            <h2 className={styles.relatedTitle}>Related Articles</h2>
            <div className={styles.relatedGrid}>
              {relatedPosts.map((related) => (
                <div key={related.slug} className={styles.relatedCard}>
                  <span className={styles.relatedCardCategory}>
                    {related.category}
                  </span>
                  <h3 className={styles.relatedCardTitle}>
                    <Link
                      href={`/blog/${related.slug}`}
                      className={styles.relatedCardLink}
                    >
                      {related.title}
                    </Link>
                  </h3>
                  <span className={styles.relatedCardMeta}>
                    {formatDate(related.date)} &middot; {related.readTime} read
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
