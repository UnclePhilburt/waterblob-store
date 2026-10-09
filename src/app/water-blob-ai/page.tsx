'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import styles from './water-blob-ai.module.css';

const ProductBlobViewerWrapper = dynamic(
  () => import('@/components/viewers/ProductBlobViewerWrapper'),
  { ssr: false }
);

type ProductType = 'waterblob' | 'skitube';
type ChatStep =
  | 'product'
  | 'size'
  | 'baseColor'
  | 'stripeStyle'
  | 'stripeColor'
  | 'useCase'
  | 'waterDepth'
  | 'timeline'
  | 'quantity'
  | 'contact'
  | 'notes'
  | 'ready';

type ChatMessage = {
  role: 'assistant' | 'customer';
  text: string;
};

type ViewerInstance = {
  getCustomization?: () => Record<string, string> | null;
  captureScreenshot?: (width?: number, height?: number) => string | null;
  setGroupColor?: (groupIndex: number, hexColor: string) => void;
  partGroups?: Array<{ name: string }>;
  destroy: () => void;
};

type Config = {
  product: ProductType | '';
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

const WATER_BLOB_SIZES = ['25 ft Weekender', '30 ft Original', '35 ft Original', '40 ft Original'];
const SKI_TUBE_SIZES = ['Standard ski tube', 'Custom ski tube'];
const COLORS = ['Blue', 'Yellow', 'Red', 'Green', 'Black', 'White', 'Gray', 'Orange'];
const STRIPES = ['No stripes', 'Single stripe', 'Two stripes', 'Side stripes', 'Custom stripe layout'];
const USE_CASES = ['Summer camp', 'Resort', 'Private lake', 'Rental business', 'Marina', 'Other'];
const TIMELINES = ['ASAP', 'This month', '1-3 months', 'Before summer', 'Just planning'];

const COLOR_HEX: Record<string, string> = {
  Blue: '#0044AA',
  Yellow: '#FFD600',
  Red: '#E53935',
  Green: '#16A34A',
  Black: '#111827',
  White: '#FFFFFF',
  Gray: '#9CA3AF',
  Orange: '#F97316',
};

const INITIAL_CONFIG: Config = {
  product: '',
  size: '',
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
    text: 'Hi, I can build your Water Blob quote. What size are you looking for? If you need a Ski Tube instead, just say Ski Tube.',
  },
];

function productLabel(product: ProductType | '') {
  if (product === 'skitube') return 'Ski Tube';
  if (product === 'waterblob') return 'Water Blob';
  return 'Water Blob';
}

function modelForConfig(config: Config) {
  if (config.product === 'skitube') return '/assets/skitube3dmodel/skitube.glb';
  if (config.size.includes('25')) return '/assets/weekender.glb';
  if (config.size.includes('35')) return '/assets/blob35.glb';
  if (config.size.includes('40')) return '/assets/blob.glb';
  return '/assets/blob30.glb';
}

function sizeOptionsFor(product: ProductType | '') {
  return product === 'skitube' ? SKI_TUBE_SIZES : WATER_BLOB_SIZES;
}

function summarizeConfig(config: Config) {
  const parts = [
    `Product: ${productLabel(config.product)}`,
    `Size: ${config.size || 'Not selected'}`,
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

function questionForStep(step: ChatStep, config: Config) {
  switch (step) {
    case 'product':
      return 'What size Water Blob are you looking for? If you need a Ski Tube instead, just say Ski Tube.';
    case 'size':
      return `What size ${productLabel(config.product)} do you want? Options: ${sizeOptionsFor(config.product).join(', ')}.`;
    case 'baseColor':
      return `What main color should the body be? Options: ${COLORS.join(', ')}.`;
    case 'stripeStyle':
      return `How do you want the stripes laid out? Options: ${STRIPES.join(', ')}.`;
    case 'stripeColor':
      return `What color should the stripe be? Options: ${COLORS.join(', ')}.`;
    case 'useCase':
      return `Who is this for? Examples: ${USE_CASES.join(', ')}.`;
    case 'waterDepth':
      return config.product === 'waterblob'
        ? 'How deep is the water where this will be used?'
        : 'Where will the ski tube mostly be used?';
    case 'timeline':
      return `When do you need it? Options: ${TIMELINES.join(', ')}.`;
    case 'quantity':
      return 'How many should we quote?';
    case 'contact':
      return 'What name, email, and phone should we use for the quote?';
    case 'notes':
      return 'Any logo, stripe notes, or special details?';
    default:
      return 'Review this and type "send quote" when you want me to submit it.';
  }
}

function nextStep(current: ChatStep): ChatStep {
  const flow: ChatStep[] = [
    'product',
    'size',
    'baseColor',
    'stripeStyle',
    'stripeColor',
    'useCase',
    'waterDepth',
    'timeline',
    'quantity',
    'contact',
    'notes',
    'ready',
  ];
  return flow[Math.min(flow.indexOf(current) + 1, flow.length - 1)];
}

function parseProduct(text: string): ProductType {
  return text.toLowerCase().includes('ski') ? 'skitube' : 'waterblob';
}

function parseSize(product: ProductType, text: string) {
  const normalized = text.toLowerCase();
  const options = sizeOptionsFor(product);
  return options.find((option) => {
    const optionText = option.toLowerCase();
    const number = option.match(/\d+/)?.[0];
    return normalized.includes(optionText) || Boolean(number && normalized.includes(number));
  }) || '';
}

function parseContact(text: string) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phone = text.match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/)?.[0] || '';
  const name = text
    .replace(email, '')
    .replace(phone, '')
    .replace(/\b(name|email|phone|is|my|number)\b/gi, '')
    .replace(/[,:;]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  return { name, email, phone };
}

export default function WaterBlobAiPage() {
  const [config, setConfig] = useState<Config>(INITIAL_CONFIG);
  const [messages, setMessages] = useState<ChatMessage[]>(START_MESSAGES);
  const [step, setStep] = useState<ChatStep>('product');
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const viewerRef = useRef<ViewerInstance | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const modelPath = useMemo(() => modelForConfig(config), [config]);
  const currentQuestion = questionForStep(step, config);
  const progress = Math.round(([
    'product',
    'size',
    'baseColor',
    'stripeStyle',
    'stripeColor',
    'useCase',
    'waterDepth',
    'timeline',
    'quantity',
    'contact',
    'notes',
    'ready',
  ].indexOf(step) / 11) * 100);

  const syncViewerColors = useCallback((viewer: ViewerInstance | null, nextConfig: Config) => {
    if (!viewer?.setGroupColor || !viewer.partGroups?.length) return;

    const baseHex = COLOR_HEX[nextConfig.baseColor] || COLOR_HEX.Blue;
    const stripeHex = nextConfig.stripeStyle === 'No stripes'
      ? baseHex
      : COLOR_HEX[nextConfig.stripeColor] || COLOR_HEX.Yellow;

    viewer.partGroups.forEach((group, index) => {
      const name = group.name.toLowerCase();
      if (name.includes('primary') || name.includes('main') || name.includes('top') || name.includes('bottom')) {
        viewer.setGroupColor?.(index, baseHex);
      }
      if (name.includes('secondary') || name.includes('side')) {
        viewer.setGroupColor?.(index, stripeHex);
      }
      if (name.includes('handles')) {
        viewer.setGroupColor?.(index, stripeHex);
      }
    });
  }, []);

  const scheduleColorSync = useCallback((viewer: ViewerInstance | null, nextConfig: Config) => {
    [120, 350, 800, 1400].forEach((delay) => {
      window.setTimeout(() => syncViewerColors(viewer, nextConfig), delay);
    });
  }, [syncViewerColors]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    scheduleColorSync(viewerRef.current, config);
  }, [config, modelPath, scheduleColorSync]);

  function askNext(next: ChatStep, nextConfig: Config, extra?: string) {
    const question = questionForStep(next, nextConfig);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: extra ? `${extra} ${question}` : question,
      },
    ]);
    setStep(next);
  }

  async function processAnswer(rawAnswer: string) {
    const answer = rawAnswer.trim();
    if (!answer) return;

    setError('');
    setSubmitted(false);
    setInput('');

    if (step === 'ready' && /\b(send|submit|quote|request)\b/i.test(answer)) {
      setMessages((prev) => [...prev, { role: 'customer', text: answer }]);
      await sendInquiry();
      return;
    }

    let nextConfig = { ...config };
    let helper = '';

    if (step === 'product') {
      const product = parseProduct(answer);
      const parsedSize = parseSize(product, answer);
      nextConfig = {
        ...nextConfig,
        product,
        size: parsedSize,
      };
      helper = product === 'skitube'
        ? 'Perfect. Ski Tube selected.'
        : 'Perfect, I will assume Water Blob.';
    } else if (step === 'size') {
      nextConfig.size = answer;
      helper = 'Got it.';
    } else if (step === 'baseColor') {
      nextConfig.baseColor = answer;
      helper = 'Nice, the preview is changing now.';
    } else if (step === 'stripeStyle') {
      nextConfig.stripeStyle = answer;
      helper = answer === 'No stripes' ? 'Clean look.' : 'Stripe layout saved.';
    } else if (step === 'stripeColor') {
      nextConfig.stripeColor = answer;
      helper = 'Stripe color saved, and the model is updating.';
    } else if (step === 'useCase') {
      nextConfig.useCase = answer;
      helper = 'That helps us quote it correctly.';
    } else if (step === 'waterDepth') {
      nextConfig.waterDepth = answer;
      helper = nextConfig.product === 'waterblob'
        ? 'For Water Blob use, we usually recommend 8-10 ft minimum water depth.'
        : 'Use location saved.';
    } else if (step === 'timeline') {
      nextConfig.timeline = answer;
      helper = 'Timeline saved.';
    } else if (step === 'quantity') {
      const quantity = Number(answer.replace(/\D/g, '')) || 1;
      nextConfig.quantity = Math.max(1, quantity);
      helper = 'Quantity saved.';
    } else if (step === 'contact') {
      const contact = parseContact(answer);
      nextConfig.name = contact.name || nextConfig.name;
      nextConfig.email = contact.email || nextConfig.email;
      nextConfig.phone = contact.phone || nextConfig.phone;
      helper = contact.email && contact.phone
        ? 'Contact saved.'
        : 'I saved what I could. If name, email, or phone is missing, add it in the next note.';
    } else if (step === 'notes') {
      nextConfig.notes = answer === 'No extra notes'
        ? nextConfig.notes
        : [nextConfig.notes, answer].filter(Boolean).join('\n');
      helper = 'Added.';
    } else {
      nextConfig.notes = [nextConfig.notes, answer].filter(Boolean).join('\n');
      helper = 'Added that note.';
    }

    setConfig(nextConfig);
    syncViewerColors(viewerRef.current, nextConfig);
    setMessages((prev) => [...prev, { role: 'customer', text: answer }]);

    const next = nextStep(step);
    if (step === 'product' && nextConfig.size) {
      askNext('baseColor', nextConfig, `${helper} I grabbed the size too.`);
      return;
    }
    if (step === 'notes') {
      askNext('ready', nextConfig, 'Everything is ready.');
      return;
    }
    if (step === 'ready') {
      try {
        const response = await fetch('/api/customer-product-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: answer,
            config: nextConfig,
            conversationHistory: messages,
          }),
        });
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: `${data.reply || 'I added that to the quote notes.'} Type "send quote" when you want me to submit it.` },
        ]);
      } catch {
        setMessages((prev) => [...prev, { role: 'assistant', text: 'I added that to the quote notes. Type "send quote" when you want me to submit it.' }]);
      }
      return;
    }

    askNext(next, nextConfig, helper);
  }

  async function handleTypedSubmit(e: FormEvent) {
    e.preventDefault();
    await processAnswer(input);
  }

  async function sendInquiry() {
    setSubmitting(true);
    setError('');

    if (!config.name || !config.email || !config.phone) {
      setError('I still need a name, email, and phone before sending this.');
      setSubmitting(false);
      setStep('contact');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Send me the customer name, email, and phone number, then I can submit the quote.' },
      ]);
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
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Sent. We have the product, 3D color choices, notes, and contact details.' },
      ]);
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
            Chat through a Water Blob or Ski Tube quote while the 3D preview updates in real time.
          </p>
        </div>
        <a href="tel:+14178648461" className={styles.phoneLink}>(417) 864-8461</a>
      </section>

      <section className={`${styles.builder} ${config.product ? styles.withPreview : styles.chatOnly}`}>
        {config.product && (
          <div className={styles.viewerPanel}>
            <div className={styles.modelStage}>
              <ProductBlobViewerWrapper
                key={`${config.product}-${config.size || 'default'}`}
                containerId="customer-ai-product-viewer"
                modelPath={modelPath}
                autoRotate
                enableInteraction
                enableColorCustomizer={false}
                showAllParts
                quality="medium"
                onViewerReady={(viewer) => {
                  viewerRef.current = viewer;
                  scheduleColorSync(viewer, config);
                }}
              />
            </div>
            <div className={styles.previewMeta}>
              <span>Live 3D preview</span>
              <strong>{productLabel(config.product)}</strong>
              <span>
                {config.size || 'Size pending'} · {config.baseColor}
                {config.stripeStyle === 'No stripes' ? ' · no stripes' : ` with ${config.stripeColor} ${config.stripeStyle.toLowerCase()}`}
              </span>
            </div>
          </div>
        )}

        <div className={styles.chatPanel}>
          <div className={styles.chatTop}>
            <div>
              <h2>Customer Chat</h2>
              <p>{currentQuestion}</p>
            </div>
            <span className={styles.status}>{progress}%</span>
          </div>

          <div className={styles.messages} ref={messagesRef}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`${styles.message} ${message.role === 'customer' ? styles.customer : styles.assistant}`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className={styles.chatComposer}>
            <form className={styles.freeText} onSubmit={handleTypedSubmit}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  step === 'contact'
                    ? 'Type name, email, and phone'
                    : step === 'ready'
                      ? 'Type "send quote" or add another note'
                      : 'Type your answer'
                }
              />
            </form>
          </div>

          <div className={styles.quoteSummary}>
            <div>
              <span>Quote draft</span>
              <strong>{config.product ? productLabel(config.product) : 'Not picked yet'}</strong>
            </div>
            <div>
              <span>Size</span>
              <strong>{config.size || 'Pending'}</strong>
            </div>
            <div>
              <span>Look</span>
              <strong>{config.baseColor} / {config.stripeColor}</strong>
            </div>
            <div>
              <span>Contact</span>
              <strong>{config.name || 'Pending'}</strong>
            </div>
          </div>

          <div className={styles.submitArea}>
            {error && <div className={styles.error}>{error}</div>}
            {submitted && <div className={styles.success}>Quote request sent.</div>}
            <p>{submitting ? 'Sending quote request...' : step === 'ready' ? 'Type "send quote" to submit.' : 'Answer each chat question to finish the quote.'}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
