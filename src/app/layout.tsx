import type { Metadata } from 'next';
import './globals.css';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export const metadata: Metadata = {
  title: 'Water Blob® | Commercial Water Trampolines & Lake Inflatables Since 1984',
  description:
    'Water Blob® - The original water trampoline launcher since 1984. Commercial-grade inflatable water toys for summer camps, resorts, and lakes. Trusted by 500+ camps worldwide.',
  keywords:
    'water blob, blob launcher, summer camp equipment, inflatable water toys, lake inflatables, camp activities, water trampoline, blob jumping',
  authors: [{ name: 'Water Blob®' }],
  metadataBase: new URL('https://thewaterblob.com'),
  openGraph: {
    type: 'website',
    title: 'Water Blob® — Ultimate Summer Camp Experience',
    description:
      'The original Water Blob® since 1984. Commercial-grade inflatable water launchers trusted by camps worldwide.',
    images: ['/assets/homepage/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Water Blob® — Ultimate Summer Camp Experience',
    description:
      'The original Water Blob® since 1984. Commercial-grade inflatable water launchers trusted by camps worldwide.',
    images: ['/assets/homepage/logo.png'],
  },
  icons: {
    icon: '/assets/homepage/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {apiBaseUrl && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.WATERBLOB_API_BASE = ${JSON.stringify(apiBaseUrl)};
                (function() {
                  var nativeFetch = window.fetch.bind(window);
                  window.fetch = function(input, init) {
                    if (typeof input === 'string' && input.indexOf('/api/') === 0) {
                      return nativeFetch(window.WATERBLOB_API_BASE + input, init);
                    }
                    if (input && input.url && input.url.indexOf(window.location.origin + '/api/') === 0) {
                      return nativeFetch(input.url.replace(window.location.origin, window.WATERBLOB_API_BASE), init);
                    }
                    return nativeFetch(input, init);
                  };
                })();
              `,
            }}
          />
        )}
        {/* Inline theme script to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var saved = localStorage.getItem('theme');
                if (!saved) {
                  saved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.setAttribute('data-theme', saved);
              })();
            `,
          }}
        />
      </head>
      <body>
        <AnalyticsProvider>
          <Navbar />
          {children}
          <Footer />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
