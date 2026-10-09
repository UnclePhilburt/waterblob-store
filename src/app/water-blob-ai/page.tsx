'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import styles from './water-blob-ai.module.css';

const ProductBlobViewerWrapper = dynamic(
  () => import('@/components/viewers/ProductBlobViewerWrapper'),
  { ssr: false }
);

type ProductType = 'waterblob';
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
  endCapColor: string;
  stripeStyle: string;
  useCase: string;
  waterDepth: string;
  timeline: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
};

const WATER_BLOB_SIZES = ['Family Blob / Weekender', '25 ft Weekender', '30 ft Weekender', '30 ft Original', '35 ft Original', '40 ft Original'];
const COLORS = ['Blue', 'Yellow', 'Red', 'Green', 'Black', 'White', 'Gray', 'Orange'];
const STRIPES = ['No stripes', 'Single stripe', 'Two stripes', 'Side stripes', 'Custom stripe layout'];
const USE_CASES = ['Summer camp', 'Resort', 'Private lake', 'Rental business', 'Marina', 'Other'];
const TIMELINES = ['ASAP', 'This month', '1-3 months', 'Before summer', 'Just planning'];
const THIRTY_FOOT_CLARIFICATION = 'Do you mean the 30 ft Weekender / Family Blob, or the 30 ft Original?';

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
  endCapColor: 'Blue',
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
    text: 'Hey, I am Blobby. Let us build your perfect Water Blob. Who is this for: younger kids, older kids, teens, adults, a family, a camp, or something else?',
  },
];

function productLabel(product: ProductType | '') {
  if (product === 'waterblob') return 'Water Blob';
  return 'Water Blob';
}

function modelForConfig(config: Config) {
  if (config.size.toLowerCase().includes('family')) return '/assets/weekender.glb';
  if (config.size.toLowerCase().includes('weekender')) return '/assets/weekender.glb';
  if (config.size.includes('25')) return '/assets/weekender.glb';
  if (config.size.includes('35')) return '/assets/blob35.glb';
  if (config.size.includes('40')) return '/assets/blob.glb';
  return '/assets/blob30.glb';
}

function sizeOptionsFor(product: ProductType | '') {
  return WATER_BLOB_SIZES;
}

function summarizeConfig(config: Config) {
  const parts = [
    `Product: ${productLabel(config.product)}`,
    `Size: ${config.size || 'Not selected'}`,
    `Quantity: ${config.quantity}`,
    `Base color: ${config.baseColor}`,
    `End cap color: ${config.endCapColor}`,
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
      return 'Who is this blob for: younger kids, older kids, teens, adults, a family, a camp, or something else?';
    case 'size':
      return `Pick the blob size and I will shape the preview. Bigger blobs make more launch and airtime, especially for older kids and teens. Options: ${sizeOptionsFor(config.product).join(', ')}.`;
    case 'baseColor':
      return `What main color should the body be? Options: ${COLORS.join(', ')}.`;
    case 'stripeStyle':
      return `How do you want the stripes laid out? Options: ${STRIPES.join(', ')}.`;
    case 'stripeColor':
      return `What color should the stripe be? Options: ${COLORS.join(', ')}.`;
    case 'useCase':
      return `Tell me a little more about who will use it. Family with younger kids, older kids, teens, adults, summer camp, resort, private lake?`;
    case 'waterDepth':
      return 'How deep is the water where this will be used?';
    case 'timeline':
      return `When do you need it? Options: ${TIMELINES.join(', ')}.`;
    case 'quantity':
      return 'How many are we building?';
    case 'contact':
      return 'Who should we send this masterpiece to? Name, email, and phone please.';
    case 'notes':
      return 'Any logo, stripe notes, or special details?';
    default:
      return 'Give it one last look, then type "send design" when this blob is ready to swim.';
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

function parseProduct(_text: string): ProductType {
  return 'waterblob';
}

function parseSize(product: ProductType, text: string) {
  const normalized = text.toLowerCase();
  const saysThirty = /\b30\b|\bthirty\b/.test(normalized);
  if (product === 'waterblob' && saysThirty && normalized.includes('original')) {
    return '30 ft Original';
  }
  if (product === 'waterblob' && saysThirty && normalized.includes('weekender')) {
    return '30 ft Weekender';
  }
  if (
    product === 'waterblob' &&
    (normalized.includes('family') || normalized.includes('personal') || normalized.includes('weekender'))
  ) {
    return 'Family Blob / Weekender';
  }
  const options = sizeOptionsFor(product);
  return options.find((option) => {
    const optionText = option.toLowerCase();
    const number = option.match(/\d+/)?.[0];
    return normalized.includes(optionText) || Boolean(number && normalized.includes(number));
  }) || '';
}

function mentionsAmbiguousThirtyFoot(text: string) {
  const normalized = text.toLowerCase();
  const saysThirty = /\b30\b|\bthirty\b/.test(normalized);
  const saysFoot = /\b(?:ft|foot|feet|footer)\b/.test(normalized);
  const clarifiesModel = /\b(?:weekender|family|original)\b/.test(normalized);
  return saysThirty && saysFoot && !clarifiesModel;
}

function parseThirtyFootClarification(text: string) {
  const normalized = text.toLowerCase();
  if (/\b(?:weekender|family|personal)\b/.test(normalized)) return '30 ft Weekender';
  if (normalized.includes('original')) return '30 ft Original';
  return '';
}

function parseColor(text: string) {
  const normalized = text.toLowerCase();
  return COLORS.find((color) => normalized.includes(color.toLowerCase())) || '';
}

function parseColors(text: string) {
  const normalized = text.toLowerCase();
  return COLORS.filter((color) => normalized.includes(color.toLowerCase()));
}

function parseStripeStyle(text: string) {
  const normalized = text.toLowerCase();
  if (/\b(no|none|without)\b/.test(normalized) && normalized.includes('stripe')) return 'No stripes';
  if (normalized.includes('side stripe')) return 'Side stripes';
  if (normalized.includes('two stripe') || normalized.includes('2 stripe')) return 'Two stripes';
  if (normalized.includes('custom') && normalized.includes('stripe')) return 'Custom stripe layout';
  if (normalized.includes('stripe')) return 'Single stripe';
  return '';
}

function parseUseCase(text: string) {
  const normalized = text.toLowerCase();
  if (/\b(family|families|younger kids|little kids|small kids|children|kids)\b/.test(normalized)) return text;
  if (/\b(older kids|big kids|teens|teenagers|adults|college|youth group)\b/.test(normalized)) return text;
  return USE_CASES.find((item) => normalized.includes(item.toLowerCase())) || '';
}

function shouldRecommendBiggerBlob(text: string, config: Config) {
  const normalized = text.toLowerCase();
  const olderJumpers = /\b(older kids|big kids|teens|teenagers|adults|college|youth group)\b/.test(normalized);
  const wantsAir = /\b(higher|air|airtime|launch|bigger bounce|more bounce|send them|fly)\b/.test(normalized);
  const currentSize = config.size.toLowerCase();
  const alreadyBig = currentSize.includes('35') || currentSize.includes('40');
  return Boolean(config.size) && (olderJumpers || wantsAir) && !alreadyBig;
}

function buildBiggerBlobRecommendation(config: Config) {
  const size = config.size || 'that size';
  return `For older kids and stronger jumpers, I would lean bigger than ${size}. Bigger blobs give more launch and more airtime, so the 35 ft or 40 ft Original is usually the more exciting move. Want to switch to 35 or 40, or keep ${size}?`;
}

function parseBiggerBlobSwitch(text: string) {
  const normalized = text.toLowerCase();
  if (/\b40\b|\bforty\b/.test(normalized)) return '40 ft Original';
  if (/\b35\b|\bthirty five\b|\bthirty-five\b/.test(normalized)) return '35 ft Original';
  if (/\bkeep|stay|same|no\b/.test(normalized)) return 'keep';
  return '';
}

function parseTimeline(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes('asap') || normalized.includes('soon')) return 'ASAP';
  return TIMELINES.find((item) => normalized.includes(item.toLowerCase())) || '';
}

function parseWaterDepth(text: string) {
  return text.match(/\b\d+(?:\.\d+)?\s*(?:ft|feet|foot)\b/i)?.[0] || '';
}

function parseQuantity(text: string) {
  const match = text.match(/\b(?:qty|quantity|need|want)?\s*(\d+)\b/i);
  return match ? Math.max(1, Number(match[1])) : 0;
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

function looksLikeQuestion(text: string) {
  return text.includes('?') || /^(what|how|can|do|does|is|are|which|why|where|tell me)\b/i.test(text.trim());
}

function applyNaturalLanguageAnswer(config: Config, step: ChatStep, answer: string) {
  const nextConfig = { ...config };
  const updated = new Set<string>();
  const normalized = answer.toLowerCase();
  const isQuestion = looksLikeQuestion(answer);

  if (normalized.includes('blob') || (!nextConfig.product && !isQuestion)) {
    nextConfig.product = parseProduct(answer);
    updated.add('product');
  }

  if (step === 'product' && !isQuestion) {
    nextConfig.useCase = answer;
    updated.add('useCase');
  }

  const product = nextConfig.product || 'waterblob';
  const size = parseSize(product, answer);
  if (size) {
    nextConfig.size = size;
    updated.add('size');
  } else if (step === 'size' && !isQuestion) {
    nextConfig.size = answer;
    updated.add('size');
  }

  const colors = parseColors(answer);
  const stripeStyle = parseStripeStyle(answer);
  const mentionsEndCaps = normalized.includes('end cap') || normalized.includes('endcap');
  const mentionsBody = normalized.includes('body') || normalized.includes('main') || normalized.includes('base');
  const mentionsStripe = normalized.includes('stripe');

  if (stripeStyle) {
    nextConfig.stripeStyle = stripeStyle;
    updated.add('stripeStyle');
  } else if (step === 'stripeStyle' && !isQuestion) {
    nextConfig.stripeStyle = answer;
    updated.add('stripeStyle');
  }

  if (colors.length > 0) {
    if (mentionsEndCaps) {
      nextConfig.endCapColor = colors[colors.length - 1];
      updated.add('endCapColor');
    } else if (mentionsStripe) {
      nextConfig.stripeColor = colors[colors.length - 1];
      updated.add('stripeColor');
      if (colors.length > 1) {
        nextConfig.baseColor = colors[0];
        updated.add('baseColor');
      }
    } else if (mentionsBody) {
      nextConfig.baseColor = colors[0];
      updated.add('baseColor');
    } else if (step === 'stripeColor') {
      nextConfig.stripeColor = colors[0];
      updated.add('stripeColor');
    } else {
      nextConfig.baseColor = colors[0];
      updated.add('baseColor');
    }
  } else if (step === 'baseColor' && !isQuestion) {
    const color = parseColor(answer);
    if (color) {
      nextConfig.baseColor = color;
      updated.add('baseColor');
    }
  }

  const useCase = parseUseCase(answer);
  if (useCase) {
    nextConfig.useCase = useCase;
    updated.add('useCase');
  } else if (step === 'useCase' && !isQuestion) {
    nextConfig.useCase = answer;
    updated.add('useCase');
  }

  const waterDepth = parseWaterDepth(answer);
  if (waterDepth) {
    nextConfig.waterDepth = waterDepth;
    updated.add('waterDepth');
  } else if (step === 'waterDepth' && !isQuestion) {
    nextConfig.waterDepth = answer;
    updated.add('waterDepth');
  }

  const timeline = parseTimeline(answer);
  if (timeline) {
    nextConfig.timeline = timeline;
    updated.add('timeline');
  } else if (step === 'timeline' && !isQuestion) {
    nextConfig.timeline = answer;
    updated.add('timeline');
  }

  const quantity = parseQuantity(answer);
  if (quantity && step === 'quantity') {
    nextConfig.quantity = quantity;
    updated.add('quantity');
  }

  if (step === 'contact') {
    const contact = parseContact(answer);
    nextConfig.name = contact.name || nextConfig.name;
    nextConfig.email = contact.email || nextConfig.email;
    nextConfig.phone = contact.phone || nextConfig.phone;
    updated.add('contact');
  }

  if (step === 'notes') {
    nextConfig.notes = /^(no|none|nope|nothing)$/i.test(answer)
      ? nextConfig.notes
      : [nextConfig.notes, answer].filter(Boolean).join('\n');
    updated.add('notes');
  }

  return { nextConfig, updated };
}

function nextUnansweredStep(current: ChatStep, updated: Set<string>) {
  let next = nextStep(current);
  while (updated.has(next) && next !== 'ready') {
    next = nextStep(next);
  }
  return next;
}

function isStepAlreadyAnswered(step: ChatStep, config: Config) {
  switch (step) {
    case 'product':
      return Boolean(config.product);
    case 'size':
      return Boolean(config.size);
    case 'useCase':
      return Boolean(config.useCase);
    case 'waterDepth':
      return Boolean(config.waterDepth);
    case 'timeline':
      return Boolean(config.timeline);
    case 'contact':
      return Boolean(config.name && config.email && config.phone);
    case 'notes':
    case 'ready':
      return false;
    default:
      return false;
  }
}

function nextUnansweredStepForConfig(current: ChatStep, updated: Set<string>, config: Config) {
  let next = nextUnansweredStep(current, updated);
  while (isStepAlreadyAnswered(next, config) && next !== 'ready') {
    next = nextStep(next);
  }
  return next;
}

export default function WaterBlobAiPage() {
  const [config, setConfig] = useState<Config>(INITIAL_CONFIG);
  const [messages, setMessages] = useState<ChatMessage[]>(START_MESSAGES);
  const [step, setStep] = useState<ChatStep>('product');
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [needsThirtyFootClarification, setNeedsThirtyFootClarification] = useState(false);
  const [needsBiggerBlobConfirmation, setNeedsBiggerBlobConfirmation] = useState(false);
  const viewerRef = useRef<ViewerInstance | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const colorSyncTimersRef = useRef<number[]>([]);

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
    const endCapHex = COLOR_HEX[nextConfig.endCapColor] || baseHex;
    const stripeHex = nextConfig.stripeStyle === 'No stripes'
      ? baseHex
      : COLOR_HEX[nextConfig.stripeColor] || COLOR_HEX.Yellow;

    viewer.partGroups.forEach((group, index) => {
      const name = group.name.toLowerCase();
      if (
        name.includes('primary') ||
        name.includes('main') ||
        name.includes('top') ||
        name.includes('bottom')
      ) {
        viewer.setGroupColor?.(index, baseHex);
      }
      if (name.includes('end cap')) {
        viewer.setGroupColor?.(index, endCapHex);
      }
      if (name.includes('secondary') || name.includes('side')) {
        viewer.setGroupColor?.(index, stripeHex);
      }
      if (name.includes('handles')) {
        viewer.setGroupColor?.(index, stripeHex);
      }
    });
  }, []);

  const clearColorSyncTimers = useCallback(() => {
    colorSyncTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    colorSyncTimersRef.current = [];
  }, []);

  const scheduleColorSync = useCallback((viewer: ViewerInstance | null, nextConfig: Config) => {
    clearColorSyncTimers();
    [120, 350, 800, 1400, 2400, 3800, 5600].forEach((delay) => {
      const timer = window.setTimeout(() => syncViewerColors(viewer, nextConfig), delay);
      colorSyncTimersRef.current.push(timer);
    });
  }, [clearColorSyncTimers, syncViewerColors]);

  useEffect(() => clearColorSyncTimers, [clearColorSyncTimers]);

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

  async function answerConversationQuestion(answer: string) {
    setMessages((prev) => [
      ...prev,
      { role: 'customer', text: answer },
      { role: 'assistant', text: 'Thinking...' },
    ]);

    try {
      const response = await fetch('/api/customer-product-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: answer,
          config,
          conversationHistory: messages,
        }),
      });
      const data = await response.json();
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          text: `${data.reply || 'Good question. I can help shape this Water Blob.'} ${questionForStep(step, config)}`,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: 'assistant',
          text: `Good question. I can help shape this Water Blob. ${questionForStep(step, config)}`,
        },
      ]);
    }
  }

  async function processAnswer(rawAnswer: string) {
    const answer = rawAnswer.trim();
    if (!answer) return;

    setError('');
    setSubmitted(false);
    setInput('');

    if (step === 'ready' && /\b(send|done|finished|ready|submit)\b/i.test(answer)) {
      setMessages((prev) => [...prev, { role: 'customer', text: answer }]);
      await sendInquiry();
      return;
    }

    if (needsThirtyFootClarification) {
      const clarifiedSize = parseThirtyFootClarification(answer);
      if (!clarifiedSize) {
        setMessages((prev) => [
          ...prev,
          { role: 'customer', text: answer },
          { role: 'assistant', text: THIRTY_FOOT_CLARIFICATION },
        ]);
        return;
      }

      const nextConfig = {
        ...config,
        product: 'waterblob' as ProductType,
        size: clarifiedSize,
      };
      setNeedsThirtyFootClarification(false);
      setConfig(nextConfig);
      syncViewerColors(viewerRef.current, nextConfig);
      setMessages((prev) => [...prev, { role: 'customer', text: answer }]);
      askNext('baseColor', nextConfig, 'Perfect. Now the fun part.');
      return;
    }

    if (needsBiggerBlobConfirmation) {
      const sizeChoice = parseBiggerBlobSwitch(answer);
      if (!sizeChoice) {
        setMessages((prev) => [
          ...prev,
          { role: 'customer', text: answer },
          { role: 'assistant', text: 'I can keep the current size, or switch this beast to a 35 ft or 40 ft Original for more launch. Which way are we going?' },
        ]);
        return;
      }

      const nextConfig = {
        ...config,
        size: sizeChoice === 'keep' ? config.size : sizeChoice,
      };
      setNeedsBiggerBlobConfirmation(false);
      setConfig(nextConfig);
      syncViewerColors(viewerRef.current, nextConfig);
      setMessages((prev) => [...prev, { role: 'customer', text: answer }]);
      askNext(nextUnansweredStepForConfig(step, new Set(['size']), nextConfig), nextConfig, sizeChoice === 'keep' ? 'You got it, we will keep that size.' : 'Excellent choice. More blob, more launch.');
      return;
    }

    if ((step === 'product' || step === 'size') && mentionsAmbiguousThirtyFoot(answer)) {
      setNeedsThirtyFootClarification(true);
      setMessages((prev) => [
        ...prev,
        { role: 'customer', text: answer },
        { role: 'assistant', text: THIRTY_FOOT_CLARIFICATION },
      ]);
      return;
    }

    const { nextConfig, updated } = applyNaturalLanguageAnswer(config, step, answer);
    if (looksLikeQuestion(answer) && updated.size === 0) {
      await answerConversationQuestion(answer);
      return;
    }

    let helper = 'Got it.';
    if (updated.has('product')) {
      helper = 'Perfect, we are building a Water Blob.';
    }
    if (updated.has('size')) helper = updated.has('product') ? `${helper} I grabbed the size too.` : 'Nice, I locked in that size.';
    if (updated.has('baseColor') || updated.has('stripeColor') || updated.has('stripeStyle') || updated.has('endCapColor')) {
      helper = 'Nice, the blob is coming alive.';
    }
    if (updated.has('waterDepth') && nextConfig.product === 'waterblob') helper = 'For Water Blob use, we usually recommend 8-10 ft minimum water depth.';
    if (updated.has('contact')) helper = nextConfig.email && nextConfig.phone ? 'Contact saved.' : 'I saved what I could.';
    if (updated.has('notes')) helper = 'Added.';

    setConfig(nextConfig);
    syncViewerColors(viewerRef.current, nextConfig);
    setMessages((prev) => [...prev, { role: 'customer', text: answer }]);

    const recommendationContext = `${answer} ${nextConfig.useCase}`;
    if ((updated.has('useCase') || updated.has('size')) && shouldRecommendBiggerBlob(recommendationContext, nextConfig)) {
      setNeedsBiggerBlobConfirmation(true);
      setStep('size');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: buildBiggerBlobRecommendation(nextConfig) },
      ]);
      return;
    }

    const next = nextUnansweredStepForConfig(step, updated, nextConfig);
    if (updated.size === 0 && step !== 'ready') {
      askNext(step, nextConfig, "I am not sure I caught that design detail.");
      return;
    }
    if (!updated.has(step) && step !== 'product' && step !== 'notes' && step !== 'ready') {
      askNext(step, nextConfig, helper);
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
          { role: 'assistant', text: `${data.reply || 'I tucked that into the design notes.'} Type "send design" when this thing is ready.` },
        ]);
      } catch {
        setMessages((prev) => [...prev, { role: 'assistant', text: 'I tucked that into the design notes. Type "send design" when this thing is ready.' }]);
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
      setError('I still need a name, email, and phone before sending this design.');
      setSubmitting(false);
      setStep('contact');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Send me the customer name, email, and phone number, then I can launch this design over to the Water Blob team.' },
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
        endCapColor: config.endCapColor,
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
          productName: `${productLabel(config.product)} AI Design`,
          productPrice: 0,
          productSize: config.size,
          quantity: config.quantity,
          productImage: '/assets/homepage/blob/oceanblobjump.webp',
          customization,
          customImage,
          _t: Date.now() - 5000,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send design');
      }

      setSubmitted(true);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Splashed it over. We have the size, colors, notes, preview, and contact details.' },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send design');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <Link href="/products" className={styles.backLink}>Products</Link>
          <h1>Blobby</h1>
          <p>
            Customize your own Water Blob with Blobby while the 3D preview updates in real time.
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
                onModelReady={(viewer) => {
                  viewerRef.current = viewer;
                  syncViewerColors(viewer, config);
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
                {` · ${config.endCapColor} end caps`}
              </span>
            </div>
          </div>
        )}

        <div className={styles.chatPanel}>
          <div className={styles.chatTop}>
            <div>
              <h2>Blobby Chat</h2>
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
                      ? 'Type "send design" or add another idea'
                      : 'Type your answer'
                }
              />
            </form>
          </div>

          <div className={styles.quoteSummary}>
            <div>
              <span>Blob draft</span>
              <strong>{config.product ? productLabel(config.product) : 'Not picked yet'}</strong>
            </div>
            <div>
              <span>Size</span>
              <strong>{config.size || 'Pending'}</strong>
            </div>
            <div>
              <span>Look</span>
              <strong>{config.baseColor} / {config.stripeColor} / {config.endCapColor}</strong>
            </div>
            <div>
              <span>Contact</span>
              <strong>{config.name || 'Pending'}</strong>
            </div>
          </div>

          <div className={styles.submitArea}>
            {error && <div className={styles.error}>{error}</div>}
            {submitted && <div className={styles.success}>Blob design sent.</div>}
            <p>{submitting ? 'Sending your blob design...' : step === 'ready' ? 'Type "send design" when this masterpiece is ready.' : 'Answer each chat question to finish your blob.'}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
