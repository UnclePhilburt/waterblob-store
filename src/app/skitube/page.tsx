'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductInquiryForm from '@/components/ui/ProductInquiryForm';
import styles from './skitube.module.css';

const product = {
  id: 3,
  name: 'Water Blob\u00ae Ski Tube',
  price: 1795.0,
  image_url: '/assets/homepage/skitube/skitube1.jpg',
};

const images = ['/assets/homepage/skitube/skitube1.jpg'];

export default function SkitubePage() {
  const [mainImage, setMainImage] = useState(images[0]);
  const [quantity, setQuantity] = useState(1);

  return (
    <section className="product-page">
      <div className="container">
        <div className="product-grid">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              <Image src={mainImage} alt={product.name} width={600} height={400} />
            </div>
            <div className="thumbnail-grid">
              {images.map((img) => (
                <div
                  key={img}
                  className={`thumbnail ${mainImage === img ? `active ${styles.thumbnailActive}` : ''}`}
                  onClick={() => setMainImage(img)}
                >
                  <Image src={img} alt={product.name} width={100} height={75} />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info">
            <h1>{product.name}</h1>

            <div className="product-price">
              <span className="price">${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>

            <p className="product-description">
              Get ready for high-speed water action with our premium ski tube!
              Designed for thrilling rides behind boats, this heavy-duty towable
              delivers excitement for riders of all ages. Built with
              commercial-grade materials for lasting durability at camps, resorts,
              and private waterfronts.
            </p>

            <div className="product-features">
              <h3>Features</h3>
              <ul>
                <li>Heavy-duty commercial-grade construction</li>
                <li>Multiple riding positions</li>
                <li>Secure grip handles</li>
                <li>Quick-connect tow point</li>
                <li>High-visibility colors</li>
                <li>Reinforced stitching</li>
              </ul>
            </div>

            <div className="product-specs">
              <h3>Specifications</h3>
              <ul>
                <li>
                  <strong>Material:</strong> Heavy-duty nylon with PVC bladder
                </li>
                <li>
                  <strong>Capacity:</strong> 1-3 riders
                </li>
                <li>
                  <strong>Use:</strong> Towed behind motorized watercraft
                </li>
                <li>
                  <strong>Inflation:</strong> Quick-inflate valve system
                </li>
              </ul>
            </div>

            <div className="product-actions">
              <div className="quantity-selector">
                <label htmlFor="quantity">Quantity:</label>
                <input
                  type="number"
                  id="quantity"
                  min={1}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val >= 1) setQuantity(val);
                  }}
                />
              </div>
            </div>

            <ProductInquiryForm
              productName={product.name}
              productPrice={product.price}
              quantity={quantity}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
