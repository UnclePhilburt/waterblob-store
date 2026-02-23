import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Water Blob\u00ae Products | Commercial Water Trampolines 25ft-40ft',
  description:
    'Buy Water Blob\u00ae commercial water trampolines in 25ft, 30ft, 35ft, and 40ft sizes. Premium inflatable launchers for camps, resorts, and waterfronts. Original since 1984.',
  openGraph: {
    title:
      'Water Blob\u00ae Products | Buy Commercial Water Trampolines | All Sizes',
    description:
      'Shop Water Blob\u00ae inflatable launchers in sizes from 25ft to 40ft. Commercial-grade quality for camps and resorts.',
    url: 'https://thewaterblob.com/products',
    images: ['/assets/homepage/logo.png'],
  },
  alternates: {
    canonical: 'https://thewaterblob.com/products',
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
