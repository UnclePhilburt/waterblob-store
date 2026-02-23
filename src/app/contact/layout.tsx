import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact — Water Blob\u00ae',
  description:
    'Get in touch with the Water Blob\u00ae team. Request a quote, ask about custom orders, or reach out for product support. Call (417) 864-8461 or email lorie@thewaterblob.com.',
  openGraph: {
    title: 'Contact — Water Blob\u00ae',
    description:
      'Contact Water Blob\u00ae for quotes, custom orders, product support, and more. The original water trampoline launcher since 1984.',
    url: 'https://thewaterblob.com/contact',
    type: 'website',
    images: ['/assets/homepage/logo.png'],
  },
  alternates: {
    canonical: 'https://thewaterblob.com/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
