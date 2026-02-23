import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Water Slides — Water Blob\u00ae',
  description:
    'Custom inflatable water slides for docks and lakefronts. Perfect for summer camps, resorts, and private properties. Durable commercial-grade construction.',
  openGraph: {
    title: 'Inflatable Water Slides — Water Blob\u00ae',
    description:
      'Custom inflatable water slides for docks and lakefronts. Perfect for camps and resorts.',
    url: 'https://thewaterblob.com/waterslides',
    images: ['/assets/homepage/waterslide/waterslide.webp'],
  },
  alternates: { canonical: 'https://thewaterblob.com/waterslides' },
};

export default function WaterslidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
