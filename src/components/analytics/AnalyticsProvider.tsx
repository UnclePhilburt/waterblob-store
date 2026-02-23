'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function isBot(): boolean {
  if (typeof navigator === 'undefined') return true;
  const ua = navigator.userAgent.toLowerCase();
  const botPatterns = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'facebookexternalhit', 'twitterbot', 'chrome-lighthouse',
  ];
  return botPatterns.some((p) => ua.includes(p));
}

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem('wbs_session_id');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('wbs_session_id', id);
    }
    return id;
  } catch {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

function getUserId(): string {
  try {
    let id = localStorage.getItem('wbs_user_id');
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('wbs_user_id', id);
    }
    return id;
  } catch {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Lightweight analytics provider that mirrors the old analytics-tracker.js,
 * error-logger.js, and heatmap-tracker.js — sending events to `/api/analytics`.
 */
export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const eventsRef = useRef<Record<string, unknown>[]>([]);
  const pageLoadRef = useRef(Date.now());
  const maxScrollRef = useRef(0);

  // Flush batch every 10 seconds
  useEffect(() => {
    if (isBot()) return;

    const flush = async () => {
      if (eventsRef.current.length === 0) return;
      const batch = [...eventsRef.current];
      eventsRef.current = [];
      try {
        await fetch('/api/analytics/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: batch }),
        });
      } catch {
        // silently drop on failure
      }
    };

    const id = setInterval(flush, 10_000);
    return () => {
      clearInterval(id);
      flush();
    };
  }, []);

  // Track page view on route change
  useEffect(() => {
    if (isBot()) return;

    pageLoadRef.current = Date.now();
    maxScrollRef.current = 0;

    eventsRef.current.push({
      type: 'pageview',
      timestamp: Date.now(),
      sessionId: getSessionId(),
      userId: getUserId(),
      page: pathname,
      title: document.title,
      referrer: document.referrer,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });
  }, [pathname]);

  // Click tracking
  useEffect(() => {
    if (isBot()) return;

    const handler = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      eventsRef.current.push({
        type: 'click',
        timestamp: Date.now(),
        sessionId: getSessionId(),
        userId: getUserId(),
        page: pathname,
        elementType: el.tagName,
        elementId: el.id || null,
        x: e.clientX,
        y: e.clientY,
      });
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [pathname]);

  // Scroll depth tracking
  useEffect(() => {
    if (isBot()) return;

    const handler = () => {
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      const pct = Math.round((scrollTop / (docHeight - winHeight)) * 100) || 0;
      if (pct > maxScrollRef.current) {
        maxScrollRef.current = pct;
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [pathname]);

  // Page exit beacon
  useEffect(() => {
    if (isBot()) return;

    const handler = () => {
      const data = {
        type: 'page_exit',
        timestamp: Date.now(),
        sessionId: getSessionId(),
        userId: getUserId(),
        page: pathname,
        timeOnPage: Math.round((Date.now() - pageLoadRef.current) / 1000),
        maxScrollDepth: maxScrollRef.current,
      };
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon('/api/analytics', blob);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [pathname]);

  // Global error handler
  useEffect(() => {
    if (isBot()) return;

    const handler = (event: ErrorEvent) => {
      eventsRef.current.push({
        type: 'error',
        timestamp: Date.now(),
        sessionId: getSessionId(),
        page: pathname,
        message: event.message,
        source: event.filename,
        line: event.lineno,
        col: event.colno,
      });
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, [pathname]);

  // Expose trackCustom for cart.js analytics calls
  useEffect(() => {
    (window as unknown as Record<string, unknown>).wbAnalytics = {
      trackCustom(type: string, data: Record<string, unknown> = {}) {
        eventsRef.current.push({
          type,
          timestamp: Date.now(),
          sessionId: getSessionId(),
          userId: getUserId(),
          page: pathname,
          ...data,
        });
      },
    };
  }, [pathname]);

  return <>{children}</>;
}
