import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — Water Blob®',
  description:
    'Discover the story behind Water Blob® — the original water trampoline launcher, trusted by camps and resorts worldwide since 1985. Over 40 years of family-owned quality and innovation.',
  openGraph: {
    title: 'About — Water Blob®',
    description:
      'The original Water Blob® since 1985. Learn about our 40+ year history of crafting the world\'s best water launchers.',
    images: ['/assets/about/JUNIOR3_094_42608b5d-3bfe-4f81-8870-3dd7fb5ca01a.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About — Water Blob®',
    description:
      'The original Water Blob® since 1985. Learn about our 40+ year history of crafting the world\'s best water launchers.',
    images: ['/assets/about/JUNIOR3_094_42608b5d-3bfe-4f81-8870-3dd7fb5ca01a.jpg'],
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
