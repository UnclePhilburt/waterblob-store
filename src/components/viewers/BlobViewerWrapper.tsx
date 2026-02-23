'use client';

import { useEffect, useRef } from 'react';

interface BlobViewerWrapperProps {
  style?: React.CSSProperties;
  className?: string;
}

export default function BlobViewerWrapper({ style, className }: BlobViewerWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function initViewer() {
      if (!containerRef.current || !mounted) return;

      const { BlobViewer } = await import('./blob-viewer.js');

      if (!mounted || !containerRef.current) return;

      try {
        viewerRef.current = new BlobViewer();
      } catch (err) {
        // silently handled
      }
    }

    initViewer();

    return () => {
      mounted = false;
      if (viewerRef.current && viewerRef.current.destroy) {
        try {
          viewerRef.current.destroy();
        } catch (e) {
          console.warn('Viewer destroy error:', e);
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="canvas-container"
      style={{ width: '100%', height: '100%', ...style }}
      className={className}
    />
  );
}
