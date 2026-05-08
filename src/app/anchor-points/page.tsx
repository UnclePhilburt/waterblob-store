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
  { key: 'blob30', label: '30ft Blob', modelPath: '/assets/blob30.glb', anchorCount: 10 },
  { key: 'blob35', label: '35ft Blob', modelPath: '/assets/blob35.glb', anchorCount: 10 },
  { key: 'blob40', label: '40ft Blob', modelPath: '/assets/blob.glb', anchorCount: 10 },
  { key: 'weekender', label: 'Weekender', modelPath: '/assets/weekender.glb', anchorCount: 6 },
];

const SETUP_STEPS: Array<{ title: string; body: (anchorCount: number, label: string) => string }> = [
  {
    title: 'Prepare',
    body: () => 'Lay your Water Blob® flat on a smooth surface, free of sticks and sharp objects.',
  },
  {
    title: 'Inflate',
    body: () => 'Use a leaf blower to inflate. It only takes about 5 minutes — fill until 1/2 to 3/4 full of air.',
  },
  {
    title: 'Move into the water',
    body: () => 'Make sure the area is clear of any sticks or sharp objects that could puncture the Water Blob®, then slowly guide it into the pond or lake.',
  },
  {
    title: 'D-ring pads',
    body: (anchorCount, label) =>
      `The ${label} is equipped with ${anchorCount} heavy-duty D-ring pads for safety and stability.`,
  },
  {
    title: 'Anchor',
    body: () =>
      'Anchor the Water Blob® using shock cord and a 30–50 lb anchor on each D-ring pad to ensure the best stability.',
  },
  {
    title: 'Warning labels',
    body: () =>
      'Warning labels are located at the front of the Water Blob® for all participants to view. There is also a decal confirming you purchased a Water Blob® from the ORIGINAL Blob manufacturer.',
  },
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

        <section className={styles.setup} aria-labelledby="setup-heading">
          <div className={styles.setupHeader}>
            <div className={styles.panelEyebrow}>How To&apos;s</div>
            <h2 id="setup-heading" className={styles.setupTitle}>
              Setting up your {active.label}
            </h2>
          </div>
          <ol className={styles.setupGrid}>
            {SETUP_STEPS.map((step, i) => (
              <li key={step.title} className={styles.setupCard}>
                <div className={styles.setupNumber}>{i + 1}</div>
                <div className={styles.setupCardTitle}>{step.title}</div>
                <p className={styles.setupCardBody}>{step.body(active.anchorCount, active.label)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
