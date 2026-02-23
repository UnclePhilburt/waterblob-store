import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ski Tube — Water Blob\u00ae Store',
  description:
    'Premium towable ski tube for high-speed water action. Heavy-duty commercial-grade construction for boats and camps.',
  alternates: { canonical: 'https://thewaterblob.com/skitube' },
};

export default function SkitubeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
