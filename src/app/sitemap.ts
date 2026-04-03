import type { MetadataRoute } from 'next';
import { blogPosts } from './blog/blogData';

const BASE_URL = 'https://thewaterblob.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/products`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/waterslides`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/waterslide`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/waterslide-quote`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/skitubes`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/skitube`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.7 },
  ];

  const blogPages: MetadataRoute.Sitemap = Object.values(blogPosts).map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.date,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...staticPages, ...blogPages];
}
