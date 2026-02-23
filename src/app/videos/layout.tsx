import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video Wall — Water Blob\u00ae',
  description:
    'Watch Water Blob\u00ae in action! Videos of epic launches, splashes, and summer camp fun from our amazing community. Submit your own Water Blob\u00ae moments.',
  keywords:
    'water blob videos, blob jumping videos, summer camp videos, water blob launches, blob splashes',
  alternates: {
    canonical: 'https://thewaterblob.com/videos',
  },
  openGraph: {
    type: 'website',
    url: 'https://thewaterblob.com/videos',
    title: 'Video Wall — Water Blob\u00ae',
    description:
      'Watch epic Water Blob\u00ae launches and splashes from camps and resorts worldwide. Submit your own video!',
    images: ['/assets/homepage/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Video Wall — Water Blob\u00ae',
    description:
      'Watch epic Water Blob\u00ae launches and splashes from camps and resorts worldwide.',
    images: ['/assets/homepage/logo.png'],
  },
};

export default function VideosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
