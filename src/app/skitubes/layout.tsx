import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ski Tubes — Water Blob\u00ae',
  description:
    'Towable ski tubes built for speed and fun. Commercial-grade inflatable tubes for boats, camps, and water sports enthusiasts.',
  openGraph: {
    title: 'Towable Ski Tubes — Water Blob\u00ae',
    description:
      'Towable ski tubes built for speed and fun. Commercial-grade inflatable tubes for boats and camps.',
    url: 'https://thewaterblob.com/skitubes',
    images: ['/assets/homepage/skitube/skitube1.webp'],
  },
  alternates: { canonical: 'https://thewaterblob.com/skitubes' },
};

export default function SkitubesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
