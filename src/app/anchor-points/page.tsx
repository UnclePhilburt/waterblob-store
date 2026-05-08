'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import styles from './anchor-points.module.css';

const ProductBlobViewerWrapper = dynamic(
  () => import('@/components/viewers/ProductBlobViewerWrapper'),
  { ssr: false }
);

interface ModelOption {
  key: string;
  label: string;
  modelPath: string;
  anchorCount: number;
}

const MODELS: ModelOption[] = [
  { key: 'blob30', label: '30ft Blob', modelPath: '/assets/blob30.glb', anchorCount: 4 },
  { key: 'blob40', label: '40ft Blob', modelPath: '/assets/blob.glb', anchorCount: 4 },
  { key: 'weekender', label: 'Weekender', modelPath: '/assets/weekender.glb', anchorCount: 3 },
];

export default function AnchorPointsPage() {
  const [activeKey, setActiveKey] = useState<string>('blob40');
  const active = MODELS.find((m) => m.key === activeKey) ?? MODELS[1];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroEyebrow}>Setup Guide</div>
        <h1 className={styles.heroTitle}>Anchor Points</h1>
        <p className={styles.heroDescription}>
          Every Water Blob® has dedicated anchor points around its perimeter.
          Use this interactive 3D guide to see exactly where they are on each
          model before you secure your blob.
        </p>
      </section>

      <div className={styles.container}>
        <div className={styles.modelTabs} role="tablist" aria-label="Select model">
          {MODELS.map((m) => (
            <button
              key={m.key}
              role="tab"
              aria-selected={activeKey === m.key}
              className={`${styles.tab} ${activeKey === m.key ? styles.tabActive : ''}`}
              onClick={() => setActiveKey(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className={styles.viewerArea}>
          <ProductBlobViewerWrapper
            key={active.key}
            containerId={`anchor-viewer-${active.key}`}
            modelPath={active.modelPath}
            autoRotate
            enableInteraction
            enableColorCustomizer={false}
            showAnchorLines
            quality="high"
          />
        </div>

        <div className={styles.notes}>
          <h2>{active.label} — {active.anchorCount} anchor points</h2>
          <p className={styles.placeholder}>
            Anchoring instructions for this model will go here. Drag to rotate
            the model and inspect each numbered anchor point.
          </p>
        </div>
      </div>
    </div>
  );
}
