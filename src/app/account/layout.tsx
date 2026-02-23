import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account - Water Blob\u00ae',
  description:
    'Manage your Water Blob\u00ae account. View orders, update profile, and manage addresses.',
  robots: 'noindex, follow',
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
