'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ProductInquiryForm from '@/components/ui/ProductInquiryForm';
import styles from './products.module.css';

const ProductBlobViewerWrapper = dynamic(
  () => import('@/components/viewers/ProductBlobViewerWrapper'),
  { ssr: false }
);

/* ==========================================================================
   Types
   ========================================================================== */

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  model_url?: string;
  category?: string;
  stock?: number;
}

interface ViewerInstance {
  getCustomization?: () => Record<string, string> | null;
  captureScreenshot?: (width?: number, height?: number) => string | null;
  destroy: () => void;
}

/* ==========================================================================
   Helpers
   ========================================================================== */

function isWaterBlob(product: Product): boolean {
  const cat = (product.category || '').toLowerCase();
  const name = product.name.toLowerCase();
  return cat.includes('water blob') || cat.includes('blob') || name.includes('blob');
}

function extractSize(name: string): number {
  const match = name.match(/(\d+)\s*ft/i);
  return match ? parseInt(match[1], 10) : 0;
}

function isWeekender(product: Product): boolean {
  return product.name.toLowerCase().includes('weekender');
}

function getShippingMethod(product: Product): string {
  const size = extractSize(product.name);
  if (isWeekender(product) && (size === 25 || size === 30)) {
    return 'UPS';
  }
  return 'Freight';
}

function formatPrice(cents: number): string {
  // If the price looks like it is already in dollars (has decimals or is small)
  // the API may return dollars directly. Adjust as needed.
  const dollars = cents;
  return dollars.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

/* ==========================================================================
   JSON-LD Schema
   ========================================================================== */

function buildJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Water Blob Products',
    description:
      'Commercial Water Blob inflatable launchers in 25ft, 30ft, 35ft, and 40ft sizes.',
    url: 'https://thewaterblob.com/products',
    numberOfItems: 4,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Product',
          name: 'Water Blob 25ft',
          url: 'https://thewaterblob.com/products',
          description: 'Commercial-grade 25ft Water Blob inflatable launcher.',
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Product',
          name: 'Water Blob 30ft',
          url: 'https://thewaterblob.com/products',
          description: 'Commercial-grade 30ft Water Blob inflatable launcher.',
        },
      },
      {
        '@type': 'ListItem',
        position: 3,
        item: {
          '@type': 'Product',
          name: 'Water Blob 35ft',
          url: 'https://thewaterblob.com/products',
          description: 'Commercial-grade 35ft Water Blob inflatable launcher.',
        },
      },
      {
        '@type': 'ListItem',
        position: 4,
        item: {
          '@type': 'Product',
          name: 'Water Blob 40ft',
          url: 'https://thewaterblob.com/products',
          description: 'Commercial-grade 40ft Water Blob inflatable launcher.',
        },
      },
    ],
  };
}

/* ==========================================================================
   Component
   ========================================================================== */

export default function ProductsPage() {
  /* ---------- State ---------- */
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  /* ---------- Viewer ref ---------- */
  const viewerInstanceRef = useRef<ViewerInstance | null>(null);
  const viewerContainerRef = useRef<HTMLDivElement | null>(null);
  const [viewerKey, setViewerKey] = useState(0);

  /* ---------- Fetch products ---------- */
  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data: Product[] = await res.json();

        const blobs = data
          .filter(isWaterBlob)
          .sort((a, b) => a.price - b.price);

        if (!cancelled) {
          setProducts(blobs);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load products');
          setLoading(false);
        }
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- Group products into lines ---------- */
  const weekenderProducts = products.filter(isWeekender);
  const originalProducts = products.filter((p) => !isWeekender(p));

  const selectedProduct = products[selectedIndex] || null;

  /* ---------- Handlers ---------- */
  const handleTabClick = useCallback(
    (product: Product) => {
      const idx = products.indexOf(product);
      if (idx === selectedIndex) return;
      setSelectedIndex(idx);
      setQuantity(1);
      // Force viewer remount by incrementing key
      setViewerKey((k) => k + 1);
    },
    [products, selectedIndex]
  );

  const handleViewerReady = useCallback((viewer: ViewerInstance) => {
    viewerInstanceRef.current = viewer;
  }, []);

  const handleQuantityChange = useCallback((value: number) => {
    const clamped = Math.max(1, Math.min(99, value));
    setQuantity(clamped);
  }, []);

  /* ---------- Viewer capture helpers (called at submit time) ---------- */
  const getCustomization = useCallback((): string | null => {
    if (!viewerInstanceRef.current) return null;
    const colors = viewerInstanceRef.current.getCustomization?.();
    return colors ? JSON.stringify(colors) : null;
  }, []);

  const getCustomImage = useCallback((): string | null => {
    if (!viewerInstanceRef.current) return null;
    return viewerInstanceRef.current.captureScreenshot?.(400, 300) ?? null;
  }, []);

  /* ---------- Render ---------- */
  return (
    <main className={styles.productsPage}>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
      />

      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/" className={styles.breadcrumbLink}>
          Home
        </Link>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">
          /
        </span>
        <span>Products</span>
      </nav>

      {/* Header */}
      <header className={styles.productsHeader}>
        <h1>Water Blob&reg; Products</h1>
        <p className={styles.productsHeaderSubtitle}>
          Commercial-grade water launchers in every size. Built to last, designed to thrill.
        </p>
      </header>

      {/* Loading / Error */}
      {loading && <p className={styles.loading}>Loading products...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {/* Main content once loaded */}
      {!loading && !error && products.length > 0 && (
        <div className={styles.productLayout}>
          {/* Left column: 3D Viewer */}
          <div className={styles.viewerColumn}>
            <div className={styles.viewerArea} ref={viewerContainerRef}>
              <ProductBlobViewerWrapper
                key={viewerKey}
                containerId={`product-viewer-${viewerKey}`}
                modelPath={selectedProduct?.model_url || '/assets/blob.glb'}
                autoRotate
                enableInteraction
                enableColorCustomizer
                showAllParts
                quality="medium"
                onViewerReady={handleViewerReady}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Right column: Product Info */}
          <div className={styles.infoColumn}>
            {/* Size Tabs */}
            <div className={styles.sizeTabs} role="tablist" aria-label="Product sizes">
              {weekenderProducts.length > 0 && (
                <div className={styles.tabGroup}>
                  <span className={styles.tabGroupLabel}>Weekender</span>
                  <div className={styles.tabGroupPills}>
                    {weekenderProducts.map((product) => {
                      const size = extractSize(product.name);
                      const idx = products.indexOf(product);
                      return (
                        <button
                          key={product.id}
                          role="tab"
                          aria-selected={idx === selectedIndex}
                          className={`${styles.sizeTab}${idx === selectedIndex ? ` ${styles.active}` : ''}`}
                          onClick={() => handleTabClick(product)}
                        >
                          {size ? `${size}ft` : product.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {originalProducts.length > 0 && (
                <div className={styles.tabGroup}>
                  <span className={styles.tabGroupLabel}>Original</span>
                  <div className={styles.tabGroupPills}>
                    {originalProducts.map((product) => {
                      const size = extractSize(product.name);
                      const idx = products.indexOf(product);
                      return (
                        <button
                          key={product.id}
                          role="tab"
                          aria-selected={idx === selectedIndex}
                          className={`${styles.sizeTab}${idx === selectedIndex ? ` ${styles.active}` : ''}`}
                          onClick={() => handleTabClick(product)}
                        >
                          {size ? `${size}ft` : product.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Product Info */}
            {selectedProduct && (
              <>
                <div className={styles.productInfoRow}>
                  <span className={styles.productInfoName}>
                    {selectedProduct.name}
                  </span>
                  <span className={styles.productInfoPrice}>
                    {formatPrice(selectedProduct.price)}
                  </span>
                </div>

                {selectedProduct.description && (
                  <p className={styles.productInfoDesc}>
                    {selectedProduct.description}
                  </p>
                )}

                <div className={styles.productInfoSpecs}>
                  <span className={styles.specChip}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    {extractSize(selectedProduct.name) ? `${extractSize(selectedProduct.name)}ft` : 'Standard'}
                  </span>
                  <span className={styles.specChip}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Premium PVC
                  </span>
                  <span className={styles.specChip}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                    Ships via {getShippingMethod(selectedProduct)}
                  </span>
                </div>

                {/* Quantity + Inquiry Form */}
                <div className={styles.purchaseRow}>
                  <div className={styles.quantityControls}>
                    <button
                      type="button"
                      className={styles.quantityBtn}
                      aria-label="Decrease quantity"
                      onClick={() => handleQuantityChange(quantity - 1)}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className={styles.quantityInput}
                      value={quantity}
                      min={1}
                      max={99}
                      aria-label="Quantity"
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) handleQuantityChange(val);
                      }}
                    />
                    <button
                      type="button"
                      className={styles.quantityBtn}
                      aria-label="Increase quantity"
                      onClick={() => handleQuantityChange(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <ProductInquiryForm
                  productName={selectedProduct.name}
                  productPrice={selectedProduct.price}
                  productSize={extractSize(selectedProduct.name) ? `${extractSize(selectedProduct.name)}ft` : undefined}
                  quantity={quantity}
                  productImage={selectedProduct.image_url}
                  getCustomization={getCustomization}
                  getCustomImage={getCustomImage}
                />

                <div className={styles.callForQuote}>
                  Or call us directly: <a href="tel:+14178648461">(417) 864-8461</a>
                  {' '}&bull;{' '}
                  <Link href="/contact">Contact Us</Link>
                </div>

                {/* Help CTA */}
                <div className={styles.helpCard}>
                  <h3>Need Help Choosing?</h3>
                  <p>
                    Not sure which size is right? Our team has helped thousands of camps
                    find the perfect Water Blob.
                  </p>
                  <Link href="/contact" className={styles.helpCardLink}>
                    Get in Touch
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* No products found */}
      {!loading && !error && products.length === 0 && (
        <p className={styles.loading}>No Water Blob products found.</p>
      )}
    </main>
  );
}
