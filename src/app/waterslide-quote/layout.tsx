import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get a Quote — Water Blob\u00ae',
  description:
    'Request a custom quote for your inflatable water slide. Perfect for summer camps, resorts, and lakefront properties.',
  openGraph: {
    title: 'Get a Water Slide Quote — Water Blob\u00ae',
    description:
      'Request a custom quote for your inflatable water slide. Perfect for camps and resorts.',
    url: 'https://thewaterblob.com/waterslide-quote',
  },
  alternates: { canonical: 'https://thewaterblob.com/waterslide-quote' },
};

export default function WaterslideQuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
