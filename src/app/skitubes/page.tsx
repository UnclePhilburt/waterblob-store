'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/cart/CartProvider';
import styles from './skitubes.module.css';

const ProductBlobViewerWrapper = dynamic(
  () => import('@/components/viewers/ProductBlobViewerWrapper'),
  { ssr: false }
);

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  model_url?: string;
  category?: string;
}

interface ViewerInstance {
  getCustomization?: () => Record<string, string> | null;
  captureScreenshot?: (width?: number, height?: number) => string | null;
  destroy: () => void;
}

const GALLERY_PHOTOS = [
  { src: '/assets/homepage/skitube/skitube1.webp', alt: 'Ski tube adventure' },
  { src: '/assets/homepage/skitube/tubing.webp', alt: 'High-speed tubing' },
  { src: '/assets/homepage/skitube/449285104_861688899318647_4598670258531989843_n_2ef70b80-2f85-4a7d-9c5e-d875335c6934.webp', alt: 'Thrilling ride' },
  { src: '/assets/homepage/skitube/456650302_898725932281610_5382758167146378589_n_7d45e8d6-e483-41de-bc77-da84f6b04f37.webp', alt: 'Epic moments' },
  { src: '/assets/homepage/skitube/456671048_898725828948287_8699036171179732895_n_80d04f86-6f55-4624-8018-555e49791659.webp', alt: 'Ski tube fun' },
  { src: '/assets/homepage/skitube/463083031_936542691833267_422361865483044909_n_20a7ceae-bf50-42b8-82b0-ac514ce45fb5.webp', alt: 'On the water' },
  { src: '/assets/homepage/skitube/Ski-Tube-Blue.webp', alt: 'Blue ski tube' },
  { src: '/assets/homepage/skitube/Ski-Tube-Yellow.webp', alt: 'Yellow ski tube' },
  { src: '/assets/homepage/skitube/tube2.webp', alt: 'Ski tube experience' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function SkitubesPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [shuffledPhotos] = useState(() => shuffleArray(GALLERY_PHOTOS));
  const viewerRef = useRef<ViewerInstance | null>(null);
  const { addToCart, maintenanceMode } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const products: Product[] = await res.json();
        const skiTube = products.find(
          (p) =>
            p.category === 'tube' ||
            p.name.toLowerCase().includes('ski tube')
        );
        if (skiTube) {
          setProduct(skiTube);
        }
      } catch (err) {
        // silently handled
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, []);

  const handleViewerReady = useCallback((viewer: ViewerInstance) => {
    viewerRef.current = viewer;
  }, []);

  function handleQuantityChange(delta: number) {
    setQuantity((prev) => Math.max(1, prev + delta));
  }

  function handleQuantityInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      setQuantity(val);
    }
  }

  function handleAddToCart() {
    if (!product) return;

    let customization: string | null = null;
    let screenshot: string | null = null;

    if (viewerRef.current) {
      const colors = viewerRef.current.getCustomization?.();
      if (colors) {
        customization = JSON.stringify(colors);
      }
      screenshot = viewerRef.current.captureScreenshot?.(400, 300) ?? null;
    }

    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
      },
      quantity,
      customization,
      screenshot
    );

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) {
    return (
      <main className={styles.tubePage}>
        <div className={styles.tubeLoading}>Loading ski tube...</div>
      </main>
    );
  }

  return (
    <main className={styles.tubePage}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSep} aria-hidden="true">/</span>
        <span>Ski Tubes</span>
      </nav>

      {/* -- Header -- */}
      <header className={styles.tubeHeader}>
        <h1>Ski Tube</h1>
        <p className={styles.tubeHeaderSubtitle}>Built for speed on the water</p>
      </header>

      {/* -- Product Section -- */}
      <section className={styles.tubeProduct}>
        {/* Left: 3D Viewer */}
        <div className={styles.viewerColumn}>
          <div className={styles.tubeViewer}>
            <ProductBlobViewerWrapper
              containerId="skitube-viewer"
              modelPath={product?.model_url || '/assets/blob.glb'}
              autoRotate
              enableInteraction
              enableColorCustomizer
              showAllParts
              quality="medium"
              onViewerReady={handleViewerReady}
            />
          </div>
        </div>

        {/* Right: Product Details */}
        <div className={styles.tubeDetails}>
          <h2 className={styles.tubeProductName}>
            {product?.name || 'Ski Tube'}
          </h2>
          <div className={styles.tubeProductPrice}>
            ${product?.price ? Number(product.price).toFixed(2) : '--'}
          </div>
          <p className={styles.tubeProductDesc}>
            {product?.description ||
              'Commercial-grade towable ski tube built for speed and fun on the water.'}
          </p>

          <div className={styles.tubeSpecs}>
            <span className={styles.specChip}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Heavy-duty PVC
            </span>
            <span className={styles.specChip}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8 12 2.5 2.5L16 9"/></svg>
              Reinforced tow point
            </span>
            <span className={styles.specChip}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>
              Safety handles
            </span>
            <span className={styles.specChip}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              Ships via UPS
            </span>
          </div>

          {/* Purchase Controls */}
          <div className={styles.tubePurchase}>
            <div className={styles.tubeQty}>
              <button
                type="button"
                className={styles.tubeQtyBtn}
                onClick={() => handleQuantityChange(-1)}
                aria-label="Decrease quantity"
              >
                -
              </button>
              <input
                type="number"
                className={styles.tubeQtyInput}
                value={quantity}
                onChange={handleQuantityInput}
                min={1}
                aria-label="Quantity"
              />
              <button
                type="button"
                className={styles.tubeQtyBtn}
                onClick={() => handleQuantityChange(1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              type="button"
              className={`${styles.tubeCartBtn}${added ? ` ${styles.tubeCartBtnAdded}` : ''}`}
              onClick={handleAddToCart}
              disabled={!product || maintenanceMode}
            >
              {maintenanceMode ? 'Ordering Unavailable' : added ? 'Added!' : 'Add to Cart'}
            </button>
          </div>

          <div className={styles.callForQuote}>
            Or call for a quote: <a href="tel:+14178648461">(417) 864-8461</a>
            {' '}&bull;{' '}
            <Link href="/contact">Contact Us</Link>
          </div>

          {/* Help Card */}
          <div className={styles.helpCard}>
            <h3>Questions?</h3>
            <p>Reach out for bulk orders, custom colors, or anything else.</p>
            <Link href="/contact" className={styles.helpCardLink}>Get in Touch</Link>
          </div>
        </div>
      </section>

      {/* -- Photo Gallery Strip -- */}
      <section className={styles.tubeGallerySection}>
        <div className={styles.tubeGalleryLabel}>In Action</div>
        <div className={styles.tubeGallery}>
          {shuffledPhotos.map((photo, index) => (
            <div key={index} className={styles.tubeGalleryItem}>
              <Image src={photo.src} alt={photo.alt} fill style={{ objectFit: 'cover' }} sizes="260px" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
