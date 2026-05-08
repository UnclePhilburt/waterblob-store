import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anchor Points | Water Blob®',
  description:
    'Interactive 3D guide to the anchor points on every Water Blob® model. Visualize where to anchor and how to secure your blob safely.',
  keywords:
    'water blob anchor points, water blob anchoring, water blob d-rings, water blob tie down, water blob installation',
  alternates: {
    canonical: 'https://thewaterblob.com/anchor-points',
  },
  openGraph: {
    type: 'website',
    url: 'https://thewaterblob.com/anchor-points',
    title: 'Water Blob® Anchor Points',
    description:
      'Explore each anchor point on the 30ft Blob, 40ft Blob, and Weekender in 3D.',
    images: ['/assets/homepage/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Water Blob® Anchor Points',
    description:
      'Interactive 3D guide to the anchor points on every Water Blob® model.',
    images: ['/assets/homepage/logo.png'],
  },
};

export default function AnchorPointsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
