import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Water Slide — Water Blob\u00ae Store',
  description:
    'Premium inflatable water slide for camps, events, and backyard fun. Commercial-grade PVC construction with reinforced seams.',
  alternates: { canonical: 'https://thewaterblob.com/waterslide' },
};

export default function WaterslideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
