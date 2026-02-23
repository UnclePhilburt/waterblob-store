import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | Water Blob® Questions Answered',
  description:
    'Water Blob® FAQ - Answers to common questions about sizing, safety, setup, maintenance, shipping, and usage. Get expert guidance from 40+ years of water recreation experience.',
  keywords:
    'water blob faq, water blob questions, blob safety, blob setup, water blob maintenance, blob sizing guide',
  alternates: {
    canonical: 'https://thewaterblob.com/faq',
  },
  openGraph: {
    type: 'website',
    url: 'https://thewaterblob.com/faq',
    title: 'Water Blob® FAQ | Common Questions Answered',
    description:
      'Everything you need to know about Water Blob® - sizing, safety, setup, maintenance, and more.',
    images: ['/assets/homepage/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Water Blob® FAQ | Common Questions Answered',
    description:
      'Everything you need to know about Water Blob® - sizing, safety, setup, and maintenance.',
    images: ['/assets/homepage/logo.png'],
  },
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
