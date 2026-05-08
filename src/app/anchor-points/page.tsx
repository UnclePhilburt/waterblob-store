'use client';

import { useCallback, useState } from 'react';
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
  const [selectedAnchor, setSelectedAnchor] = useState<number | null>(null);
  const active = MODELS.find((m) => m.key === activeKey) ?? MODELS[1];

  const handleModelChange = useCallback((key: string) => {
    setActiveKey(key);
    setSelectedAnchor(null);
  }, []);

  const handleAnchorClick = useCallback((index: number) => {
    setSelectedAnchor(index);
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroEyebrow}>Setup Guide</div>
        <h1 className={styles.heroTitle}>Anchor Points</h1>
        <p className={styles.heroDescription}>
          Every Water Blob® has dedicated anchor points around its perimeter.
          Click a numbered pin on the model to see how to secure that point.
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
              onClick={() => handleModelChange(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className={styles.layout}>
          <div className={styles.viewerArea}>
            <ProductBlobViewerWrapper
              key={active.key}
              containerId={`anchor-viewer-${active.key}`}
              modelPath={active.modelPath}
              autoRotate
              enableInteraction
              enableColorCustomizer={false}
              showAnchorHotspots
              quality="high"
              onAnchorClick={handleAnchorClick}
            />
          </div>

          <aside className={styles.panel} aria-live="polite">
            {selectedAnchor === null ? (
              <div className={styles.panelEmpty}>
                <div className={styles.panelEyebrow}>{active.label}</div>
                <div className={styles.panelTitle}>{active.anchorCount} anchor points</div>
                <p className={styles.panelHint}>
                  Click any numbered pin on the model to see anchoring
                  instructions for that point.
                </p>
              </div>
            ) : (
              <div className={styles.panelContent}>
                <div className={styles.panelEyebrow}>Anchor</div>
                <div className={styles.panelNumber}>{selectedAnchor + 1}</div>
                <p className={styles.panelHint}>
                  Anchoring instructions for this point are coming soon. For
                  now, secure to a 50&nbsp;lb sandbag, ground stake, or
                  approved tie-down at this location.
                </p>
                <button
                  className={styles.panelClear}
                  onClick={() => setSelectedAnchor(null)}
                >
                  Clear selection
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
