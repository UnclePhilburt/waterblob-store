import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shopping Cart - Water Blob\u00ae',
  description:
    'Review your Water Blob\u00ae shopping cart. Commercial-grade water blobs, inflatable water slides, and ski tubes.',
  robots: 'noindex, follow',
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
