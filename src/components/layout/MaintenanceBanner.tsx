'use client';

import { useCart } from '@/components/cart/CartProvider';

export default function MaintenanceBanner() {
  const { maintenanceMode } = useCart();

  if (!maintenanceMode) return null;

  return (
    <div className="maintenance-banner" role="status">
      <div className="maintenance-banner-inner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          Online ordering is temporarily down for maintenance. To place an order, give us a call at{' '}
          <a href="tel:+14178648461">(417) 864-8461</a>
        </span>
      </div>
    </div>
  );
}
