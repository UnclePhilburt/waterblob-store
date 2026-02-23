import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Water Blob\u00AE Blog | Expert Guides & Tips',
  description:
    'Expert guides, sizing tips, and camp leadership insights from the Water Blob\u00AE team. Discover how to get the most from your Water Blob\u00AE and build an unforgettable waterfront program.',
  keywords:
    'water blob blog, water blob guides, camp tips, water blob sizing, camp activities, waterfront programming',
  alternates: {
    canonical: 'https://thewaterblob.com/blog',
  },
  openGraph: {
    type: 'website',
    url: 'https://thewaterblob.com/blog',
    title: 'Water Blob\u00AE Blog | Expert Guides & Tips',
    description:
      'Expert guides, sizing tips, and camp leadership insights from the Water Blob\u00AE team.',
    images: ['/assets/homepage/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Water Blob\u00AE Blog | Expert Guides & Tips',
    description:
      'Expert guides, sizing tips, and camp leadership insights from the Water Blob\u00AE team.',
    images: ['/assets/homepage/logo.png'],
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
