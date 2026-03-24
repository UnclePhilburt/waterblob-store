import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },

  async redirects() {
    return [
      // Old .html public pages → Next.js routes
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/about.html', destination: '/about', permanent: true },
      { source: '/products.html', destination: '/products', permanent: true },
      { source: '/cart.html', destination: '/products', permanent: true },
      { source: '/account.html', destination: '/account', permanent: true },
      { source: '/contact.html', destination: '/contact', permanent: true },
      { source: '/faq.html', destination: '/faq', permanent: true },
      { source: '/videos.html', destination: '/videos', permanent: true },
      { source: '/waterslide.html', destination: '/waterslide', permanent: true },
      { source: '/waterslides.html', destination: '/waterslides', permanent: true },
      { source: '/waterslide-quote.html', destination: '/waterslide-quote', permanent: true },
      { source: '/skitube.html', destination: '/skitube', permanent: true },
      { source: '/skitubes.html', destination: '/skitubes', permanent: true },
      { source: '/blog.html', destination: '/blog', permanent: true },
      // Old admin pages → new admin directory
      { source: '/admin.html', destination: '/admin/', permanent: true },
      { source: '/admin-hub.html', destination: '/admin/hub.html', permanent: true },
      { source: '/admin-activity.html', destination: '/admin/activity.html', permanent: true },
      { source: '/admin-products.html', destination: '/admin/products.html', permanent: true },
      { source: '/admin-product-add.html', destination: '/admin/product-add.html', permanent: true },
      { source: '/admin-settings.html', destination: '/admin/settings.html', permanent: true },
      { source: '/admin-customers.html', destination: '/admin/customers.html', permanent: true },
      { source: '/admin-analytics.html', destination: '/admin/analytics.html', permanent: true },
      { source: '/admin-debug.html', destination: '/admin/debug.html', permanent: true },
      { source: '/admin-orders.html', destination: '/admin/orders.html', permanent: true },
      { source: '/admin-videos.html', destination: '/admin/videos.html', permanent: true },
      // Old employee pages → new employee directory
      { source: '/employee-portal.html', destination: '/employee/', permanent: true },
      { source: '/employee-hub.html', destination: '/employee/hub.html', permanent: true },
      { source: '/employee-supplies.html', destination: '/employee/supplies.html', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        // Cache GLB 3D model files for 1 year
        source: '/assets/:path*.glb',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache images for 1 month
        source: '/assets/:path*.(jpg|jpeg|png|webp|svg|gif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      // Blog article redirects from old .html paths
      {
        source: '/blog/:slug.html',
        destination: '/blog/:slug',
      },
    ];
  },
};

export default nextConfig;
