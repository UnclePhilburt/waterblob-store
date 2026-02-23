import Link from 'next/link';
import Image from 'next/image';
import { sortedBlogPosts } from './blogData';
import styles from './blog.module.css';

function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogPage() {
  const posts = sortedBlogPosts;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Water Blob\u00AE Blog',
    description:
      'Expert guides, sizing tips, and camp leadership insights from the Water Blob\u00AE team.',
    url: 'https://thewaterblob.com/blog',
    publisher: {
      '@type': 'Organization',
      name: 'Water Blob\u00AE',
      logo: {
        '@type': 'ImageObject',
        url: 'https://thewaterblob.com/assets/homepage/logo.png',
      },
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      author: {
        '@type': 'Organization',
        name: post.author,
      },
      url: `https://thewaterblob.com/blog/${post.slug}`,
    })),
  };

  return (
    <main>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <h1 className={styles.heroTitle}>
            Water Blob<sup>&reg;</sup> Blog
          </h1>
          <p className={styles.heroSubtitle}>
            Expert guides, sizing tips, and camp leadership insights to help you
            build an unforgettable waterfront program.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className={styles.postsSection}>
        <div className={styles.postsContainer}>
          {posts.length === 0 ? (
            <div className={styles.emptyState}>
              <h2 className={styles.emptyTitle}>No posts yet</h2>
              <p className={styles.emptyText}>
                Check back soon — new articles are on the way.
              </p>
            </div>
          ) : (
            <div className={styles.postsGrid}>
              {posts.map((post) => (
                <article key={post.slug} className={styles.card}>
                  {/* Image Placeholder */}
                  <div className={styles.cardImageWrapper}>
                    <Image
                      src={post.imagePlaceholder}
                      alt=""
                      width={60}
                      height={60}
                      className={styles.cardImage}
                    />
                  </div>

                  {/* Card Body */}
                  <div className={styles.cardBody}>
                    <div className={styles.cardMeta}>
                      <span className={styles.categoryBadge}>
                        {post.category}
                      </span>
                      <span className={styles.cardDate}>
                        {formatDate(post.date)}
                      </span>
                    </div>

                    <h2 className={styles.cardTitle}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className={styles.cardTitleLink}
                      >
                        {post.title}
                      </Link>
                    </h2>

                    <p className={styles.cardExcerpt}>{post.excerpt}</p>

                    <div className={styles.cardFooter}>
                      <Link
                        href={`/blog/${post.slug}`}
                        className={styles.readMore}
                      >
                        Read More{' '}
                        <span className={styles.readMoreArrow}>&rarr;</span>
                      </Link>
                      <span className={styles.readTime}>
                        {post.readTime} read
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
