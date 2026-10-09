'use client';

import { FormEvent, useCallback, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import styles from './water-blob-ai.module.css';

const ProductBlobViewerWrapper = dynamic(
  () => import('@/components/viewers/ProductBlobViewerWrapper'),
  { ssr: false }
);

type ProductType = 'waterblob' | 'skitube';

type ChatMessage = {
  role: 'assistant' | 'customer';
  text: string;
};

type ViewerInstance = {
  getCustomization?: () => Record<string, string> | null;
  captureScreenshot?: (width?: number, height?: number) => string | null;
  destroy: () => void;
};

type Config = {
  product: ProductType;
  size: string;
  quantity: number;
  baseColor: string;
  stripeColor: string;
  stripeStyle: string;
  useCase: string;
  waterDepth: string;
  timeline: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
};

const PRODUCT_OPTIONS = [
  { value: 'waterblob' as const, label: 'Water Blob', model: '/assets/blob30.glb' },
  { value: 'skitube' as const, label: 'Ski Tube', model: '/assets/skitube3dmodel/skitube.glb' },
];

const WATER_BLOB_SIZES = ['25 ft Weekender', '30 ft Original', '35 ft Original', '40 ft Original'];
const SKI_TUBE_SIZES = ['Standard ski tube', 'Custom ski tube'];
const COLORS = ['Blue', 'Yellow', 'Red', 'Green', 'Black', 'White', 'Gray', 'Orange'];
const STRIPES = ['No stripes', 'Single stripe', 'Two stripes', 'Side stripes', 'Custom stripe layout'];
const USE_CASES = ['Summer camp', 'Resort', 'Private lake', 'Rental business', 'Marina', 'Other'];
const TIMELINES = ['ASAP', 'This month', '1-3 months', 'Before summer', 'Just planning'];

const INITIAL_CONFIG: Config = {
  product: 'waterblob',
  size: '30 ft Original',
  quantity: 1,
  baseColor: 'Blue',
  stripeColor: 'Yellow',
  stripeStyle: 'Single stripe',
  useCase: '',
  waterDepth: '',
  timeline: '',
  name: '',
  email: '',
  phone: '',
  notes: '',
};

const START_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    text: 'Hi, I can help build a Water Blob or Ski Tube quote. Pick a product first, then I will collect size, stripes, colors, use case, and contact details.',
  },
];

function productLabel(product: ProductType) {
  return product === 'waterblob' ? 'Water Blob' : 'Ski Tube';
}

function modelForConfig(config: Config) {
  if (config.product === 'skitube') return '/assets/skitube3dmodel/skitube.glb';
  if (config.size.includes('25')) return '/assets/weekender.glb';
  if (config.size.includes('35')) return '/assets/blob35.glb';
  if (config.size.includes('40')) return '/assets/blob.glb';
  return '/assets/blob30.glb';
}

function summarizeConfig(config: Config) {
  const parts = [
    `Product: ${productLabel(config.product)}`,
    `Size: ${config.size}`,
    `Quantity: ${config.quantity}`,
    `Base color: ${config.baseColor}`,
    `Stripe style: ${config.stripeStyle}`,
    `Stripe color: ${config.stripeColor}`,
    config.useCase ? `Use: ${config.useCase}` : '',
    config.waterDepth ? `Water depth: ${config.waterDepth}` : '',
    config.timeline ? `Timeline: ${config.timeline}` : '',
    config.notes ? `Notes: ${config.notes}` : '',
  ].filter(Boolean);
  return parts.join('\n');
}

export default function WaterBlobAiPage() {
  const [config, setConfig] = useState<Config>(INITIAL_CONFIG);
  const [messages, setMessages] = useState<ChatMessage[]>(START_MESSAGES);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const viewerRef = useRef<ViewerInstance | null>(null);

  const modelPath = useMemo(() => modelForConfig(config), [config]);
  const sizeOptions = config.product === 'waterblob' ? WATER_BLOB_SIZES : SKI_TUBE_SIZES;

  const addAssistant = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: 'assistant', text }]);
  }, []);

  const updateConfig = useCallback(
    <K extends keyof Config>(key: K, value: Config[K], response: string) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
      setMessages((prev) => [
        ...prev,
        { role: 'customer', text: String(value) },
        { role: 'assistant', text: response },
      ]);
    },
    []
  );

  function handleProduct(product: ProductType) {
    const size = product === 'waterblob' ? '30 ft Original' : 'Standard ski tube';
    setConfig((prev) => ({ ...prev, product, size }));
    setMessages((prev) => [
      ...prev,
      { role: 'customer', text: productLabel(product) },
      {
        role: 'assistant',
        text:
          product === 'waterblob'
            ? 'Good. For a Water Blob, choose a size and then pick the stripe setup.'
            : 'Got it. For a Ski Tube, pick the tube option and stripe colors.',
      },
    ]);
  }

  async function handleTypedSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    setConfig((prev) => ({ ...prev, notes: [prev.notes, text].filter(Boolean).join('\n') }));
    setMessages((prev) => [
      ...prev,
      { role: 'customer', text },
      {
        role: 'assistant',
        text: 'Thinking through that...',
      },
    ]);

    try {
      const response = await fetch('/api/customer-product-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          config,
          conversationHistory: messages,
        }),
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          text:
            data.reply ||
            'I added that to the quote notes. Keep choosing options, or fill in contact details and send it over.',
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          text: 'I added that to the quote notes. Keep choosing options, or fill in contact details and send it over.',
        },
      ]);
    }
  }

  async function sendInquiry() {
    setSubmitting(true);
    setError('');

    if (!config.name || !config.email || !config.phone) {
      setError('Name, email, and phone are required before sending.');
      setSubmitting(false);
      return;
    }

    try {
      const customImage = viewerRef.current?.captureScreenshot?.(400, 300) || undefined;
      const viewerCustomization = viewerRef.current?.getCustomization?.() || {};
      const customization = JSON.stringify({
        ...viewerCustomization,
        product: productLabel(config.product),
        size: config.size,
        baseColor: config.baseColor,
        stripeStyle: config.stripeStyle,
        stripeColor: config.stripeColor,
      });

      const response = await fetch('/api/product-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          email: config.email,
          phone: config.phone,
          message: summarizeConfig(config),
          productName: `${productLabel(config.product)} AI Quote`,
          productPrice: 0,
          productSize: config.size,
          quantity: config.quantity,
          productImage: config.product === 'skitube'
            ? '/assets/homepage/skitube/Ski-Tube-Blue.webp'
            : '/assets/homepage/blob/oceanblobjump.webp',
          customization,
          customImage,
          _t: Date.now() - 5000,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send inquiry');
      }

      setSubmitted(true);
      addAssistant('Sent. We have the product, size, stripe/color choices, notes, and contact details. Someone will follow up.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send inquiry');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <Link href="/products" className={styles.backLink}>Products</Link>
          <h1>Water Blob AI Builder</h1>
          <p>
            Build a customer quote for Water Blobs or Ski Tubes with live 3D preview,
            colors, stripes, sizing, and contact details.
          </p>
        </div>
        <a href="tel:+14178648461" className={styles.callButton}>(417) 864-8461</a>
      </section>

      <section className={styles.builder}>
        <div className={styles.viewerPanel}>
          <div className={styles.modelStage}>
            <ProductBlobViewerWrapper
              key={`${config.product}-${config.size}`}
              containerId="customer-ai-product-viewer"
              modelPath={modelPath}
              autoRotate
              enableInteraction
              enableColorCustomizer
              showAllParts
              quality="medium"
              onViewerReady={(viewer) => {
                viewerRef.current = viewer;
              }}
            />
          </div>
          <div className={styles.previewMeta}>
            <span>{productLabel(config.product)}</span>
            <strong>{config.size}</strong>
            <span>{config.baseColor} with {config.stripeColor} {config.stripeStyle.toLowerCase()}</span>
          </div>
        </div>

        <div className={styles.chatPanel}>
          <div className={styles.chatTop}>
            <div>
              <h2>Customer Chat</h2>
              <p>Guided quote details</p>
            </div>
            <span className={styles.status}>Live preview</span>
          </div>

          <div className={styles.messages}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`${styles.message} ${message.role === 'customer' ? styles.customer : styles.assistant}`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className={styles.options}>
            <div className={styles.optionBlock}>
              <label>Product</label>
              <div className={styles.chips}>
                {PRODUCT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={config.product === option.value ? styles.activeChip : styles.chip}
                    onClick={() => handleProduct(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.optionBlock}>
              <label>Size</label>
              <div className={styles.chips}>
                {sizeOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={config.size === size ? styles.activeChip : styles.chip}
                    onClick={() => updateConfig('size', size, 'Size saved. Now choose colors and stripes.')}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.twoCols}>
              <div className={styles.optionBlock}>
                <label>Base color</label>
                <select
                  value={config.baseColor}
                  onChange={(e) => updateConfig('baseColor', e.target.value, 'Base color saved.')}
                >
                  {COLORS.map((color) => <option key={color}>{color}</option>)}
                </select>
              </div>
              <div className={styles.optionBlock}>
                <label>Stripe color</label>
                <select
                  value={config.stripeColor}
                  onChange={(e) => updateConfig('stripeColor', e.target.value, 'Stripe color saved.')}
                >
                  {COLORS.map((color) => <option key={color}>{color}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.optionBlock}>
              <label>Stripe layout</label>
              <div className={styles.chips}>
                {STRIPES.map((stripe) => (
                  <button
                    key={stripe}
                    type="button"
                    className={config.stripeStyle === stripe ? styles.activeChip : styles.chip}
                    onClick={() => updateConfig('stripeStyle', stripe, 'Stripe layout saved.')}
                  >
                    {stripe}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.twoCols}>
              <div className={styles.optionBlock}>
                <label>Use case</label>
                <select
                  value={config.useCase}
                  onChange={(e) => updateConfig('useCase', e.target.value, 'Use case saved.')}
                >
                  <option value="">Choose one</option>
                  {USE_CASES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className={styles.optionBlock}>
                <label>Timeline</label>
                <select
                  value={config.timeline}
                  onChange={(e) => updateConfig('timeline', e.target.value, 'Timeline saved.')}
                >
                  <option value="">Choose one</option>
                  {TIMELINES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.twoCols}>
              <div className={styles.optionBlock}>
                <label>Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={config.quantity}
                  onChange={(e) => setConfig((prev) => ({ ...prev, quantity: Math.max(1, Number(e.target.value) || 1) }))}
                />
              </div>
              <div className={styles.optionBlock}>
                <label>Water depth</label>
                <input
                  placeholder="Example: 10 ft"
                  value={config.waterDepth}
                  onChange={(e) => setConfig((prev) => ({ ...prev, waterDepth: e.target.value }))}
                  onBlur={() => config.waterDepth && addAssistant('Water depth saved. For Water Blob use, we normally recommend 8-10 ft minimum.')}
                />
              </div>
            </div>
          </div>

          <form className={styles.freeText} onSubmit={handleTypedSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type extra notes, like: wants red side stripes or camp logo"
            />
            <button type="submit">Add note</button>
          </form>

          <div className={styles.contactBox}>
            <h3>Send this quote request</h3>
            <div className={styles.contactGrid}>
              <input
                placeholder="Name"
                value={config.name}
                onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
              />
              <input
                type="email"
                placeholder="Email"
                value={config.email}
                onChange={(e) => setConfig((prev) => ({ ...prev, email: e.target.value }))}
              />
              <input
                type="tel"
                placeholder="Phone"
                value={config.phone}
                onChange={(e) => setConfig((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            {submitted && <div className={styles.success}>Quote request sent.</div>}
            <button className={styles.submitButton} type="button" onClick={sendInquiry} disabled={submitting}>
              {submitting ? 'Sending...' : 'Send quote request'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
