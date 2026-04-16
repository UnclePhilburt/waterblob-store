import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safety & Guidelines | Water Blob® Operator\u2019s Manual',
  description:
    'Official Water Blob® operator\u2019s manual. Safety warnings, inflation and anchoring, product use, care and maintenance, and warranty policy from Springfield Special Products.',
  keywords:
    'water blob safety, water blob manual, water blob guidelines, water blob operator manual, water blob warranty, water blob inflation, water blob anchoring',
  alternates: {
    canonical: 'https://thewaterblob.com/guidelines',
  },
  openGraph: {
    type: 'website',
    url: 'https://thewaterblob.com/guidelines',
    title: 'Water Blob® Safety & Guidelines',
    description:
      'Read the official Water Blob® operator\u2019s manual before assembly and use.',
    images: ['/assets/homepage/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Water Blob® Safety & Guidelines',
    description:
      'Official safety warnings, setup, care, and warranty information for Water Blob®.',
    images: ['/assets/homepage/logo.png'],
  },
};

export default function GuidelinesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
