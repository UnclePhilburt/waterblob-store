'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartProvider';
import styles from './waterslide.module.css';

/* ==========================================================================
   Static data
   ========================================================================== */

const product = {
  id: 2,
  name: 'Water Blob\u00ae Water Slide',
  price: 2495.0,
  image_url: '/assets/homepage/waterslide/waterslide.webp',
};

const thumbnails = [
  '/assets/homepage/waterslide/waterslide.webp',
  '/assets/homepage/waterslide/waterslidearmsup.webp',
];

const features = [
  'Durable commercial-grade PVC',
  'Safe smooth sliding surface',
  'Quick setup/takedown',
  'Reinforced seams',
  'Perfect for camps',
  'Easy to clean',
];

const specifications = [
  { label: 'Material', value: 'Commercial-grade PVC vinyl' },
  { label: 'Setup Time', value: '~30 min' },
  { label: 'Capacity', value: 'Multiple riders' },
  { label: 'Use', value: 'Freshwater lakes, ponds, pools' },
];

/* ==========================================================================
   Component
   ========================================================================== */

export default function WaterslidePage() {
  const { addToCart, maintenanceMode } = useCart();
  const [mainImage, setMainImage] = useState(thumbnails[0]);
  const [quantity, setQuantity] = useState(1);

  function handleAddToCart() {
    addToCart(product, quantity);
  }

  function handleQuantityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      setQuantity(val);
    }
  }

  return (
    <section className="product-page">
      <div className="container">
        <div className="product-grid">
          {/* Left column -- images */}
          <div className="product-images">
            <div className="main-image">
              <img
                src={mainImage}
                alt={product.name}
                width={800}
                height={600}
              />
            </div>

            <div className="thumbnail-grid">
              {thumbnails.map((src) => (
                <div
                  key={src}
                  className={`thumbnail${mainImage === src ? ` active ${styles.thumbnailActive}` : ''}`}
                  onClick={() => setMainImage(src)}
                >
                  <img
                    src={src}
                    alt={`${product.name} thumbnail`}
                    width={120}
                    height={90}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right column -- product info */}
          <div className="product-info">
            <h1>{product.name}</h1>

            <div className="product-price">
              <span className="price">
                ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <p className="product-description">
              Experience the thrill of our premium inflatable water slide!
              Perfect for camps, events, and backyard fun. Built with
              commercial-grade materials for lasting durability and endless
              summer excitement.
            </p>

            <div className="product-features">
              <h3>Features</h3>
              <ul>
                {features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className="product-specs">
              <h3>Specifications</h3>
              <ul>
                {specifications.map((spec) => (
                  <li key={spec.label}>
                    <strong>{spec.label}:</strong> {spec.value}
                  </li>
                ))}
              </ul>
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <label htmlFor="quantity">Quantity:</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min={1}
                  value={quantity}
                  onChange={handleQuantityChange}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddToCart}
                disabled={maintenanceMode}
              >
                {maintenanceMode ? 'Ordering Unavailable' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
